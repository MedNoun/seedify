var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import crypto from "crypto";
import bencode from "bencode";
import dgram from "dgram";
import { Tracker } from "./Tracker.js";
export class Network {
    getPeersList(resp) {
        let peersList = [];
        if (Buffer.isBuffer(resp)) {
            for (let i = 0; i < resp.length; i += 6) {
                peersList.push({
                    ip: resp.subarray(i, i + 4).join("."),
                    port: resp.readUInt16BE(i + 4),
                });
            }
        }
        else {
            for (let i = 0; i < resp.length; i++) {
                peersList.push({
                    ip: resp[i].ip.toString(),
                    port: resp[i].port,
                });
            }
        }
        return peersList;
    }
}
export class Udp extends Network {
    constructor(transactionId = crypto.randomBytes(4), connectionId = null) {
        super();
        this.transactionId = transactionId;
        this.connectionId = connectionId;
    }
    connect(url, event, torrent) {
        return __awaiter(this, void 0, void 0, function* () {
            const { port, hostname } = url;
            const socket = dgram.createSocket("udp4");
            socket.send(this.connectPayload, Number(port), hostname);
            const resp = yield new Promise((resolve, reject) => socket.on("message", (msg) => {
                if (msg.length < 16)
                    return reject();
                let action = msg.readUInt32BE(0);
                let respTransId = msg.subarray(4, 8);
                console.log("hala message : ", msg);
                if (this.transactionId.compare(respTransId))
                    return reject();
                switch (action) {
                    case Udp.actions.CONNECT:
                        this.connectionId = msg.subarray(8);
                        const announcePayload = this.announcePayload(event, torrent);
                        socket.send(announcePayload, Number(port), hostname);
                        break;
                    case Udp.actions.ANNOUNCE:
                        socket.close();
                        if (msg.length < 20)
                            reject();
                        const info = this.parseResponse(msg);
                        resolve(info);
                        break;
                    case Udp.actions.ERROR:
                        const err = msg.subarray(8).toString();
                        reject(err);
                        break;
                    default:
                    //logger.warn("received unknown actionId from tracker");
                }
            }));
            console.log("fking : ", resp);
            return resp;
        });
    }
    get connectPayload() {
        const payload = Buffer.alloc(16);
        payload.writeUInt32BE(0x417, 0);
        payload.writeUInt32BE(0x27101980, 4);
        payload.writeUInt32BE(Udp.actions.CONNECT, 8);
        this.transactionId.copy(payload, 12);
        return payload;
    }
    parseResponse(resp) {
        return {
            protocol: "udp",
            action: resp.readUInt32BE(0),
            transactionId: resp.readUInt32BE(4),
            interval: resp.readUInt32BE(8),
            leechers: resp.readUInt32BE(12),
            seeders: resp.readUInt32BE(16),
            peerList: this.getPeersList(resp.subarray(20)),
        };
    }
    getBufferUInt64BE(n) {
        const buf = Buffer.alloc(8);
        // buf.writeUInt32BE(n >>> 32, 0);
        // buf.writeUInt32BE(n && 0xffffffff, 4);
        buf.writeUInt32BE(n, 4);
        return buf;
    }
    announcePayload(event, torrent) {
        const { metadata, downloaded, clientId, uploaded, port } = torrent;
        const payload = Buffer.alloc(98);
        this.connectionId.copy(payload, 0); // Connection ID
        payload.writeUInt32BE(Udp.actions.ANNOUNCE, 8); // Action ID (1 for announce)
        this.transactionId.copy(payload, 12);
        metadata.infoHash.copy(payload, 16);
        Buffer.from(clientId).copy(payload, 36); // Peer ID
        const left = this.getBufferUInt64BE(metadata.length - downloaded);
        const down = this.getBufferUInt64BE(downloaded);
        const up = this.getBufferUInt64BE(uploaded);
        down.copy(payload, 56);
        left.copy(payload, 64);
        up.copy(payload, 72);
        //event (0: none; 1: completed; 2: started; 3: stopped)
        let e = 0;
        if (event === Tracker.events.COMPLETED)
            e = 1;
        else if (event === Tracker.events.STARTED)
            e = 2;
        else if (event === Tracker.events.STOPPED)
            e = 3;
        payload.writeUInt32BE(e, 80);
        // ip
        payload.writeUInt32BE(0, 84);
        //random key
        crypto.randomBytes(4).copy(payload, 88);
        // number of peers wanted (default = -1)
        payload.writeInt32BE(-1, 92);
        // port
        payload.writeUInt16BE(port, 96);
        return payload;
    }
}
Udp.actions = {
    CONNECT: 0,
    ANNOUNCE: 1,
    SCRAPE: 2,
    ERROR: 3,
};
export class Http extends Network {
    constructor() {
        super();
    }
    connect(link, event, torrent) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = this.createUrl(link, event, torrent);
            const response = yield axios.get(url, {
                responseType: "arraybuffer",
                transformResponse: [],
            });
            return this.parseResponse(response.data);
        });
    }
    parseResponse(resp) {
        console.log("the all response is here :", resp);
        const responseInfo = bencode.decode(resp);
        console.log("the all response is here :", responseInfo);
        if (responseInfo["failure reason"])
            return { error: responseInfo["failure reason"].toString() };
        return {
            protocol: "http",
            interval: responseInfo.interval,
            leechers: responseInfo.incomplete,
            seeders: responseInfo.complete,
            peerList: this.getPeersList(responseInfo.peers),
        };
    }
    createUrl(link, event, torrent) {
        const { metadata, downloaded, clientId, uploaded, port } = torrent;
        let query = {
            info_hash: escape(metadata.infoHash.toString("binary")),
            peer_id: clientId,
            port: port,
            uploaded: uploaded,
            downloaded: downloaded,
            left: metadata.length - downloaded,
            compact: 1,
            event: event,
        };
        let url = link.href + "?";
        for (const key in query) {
            url += key + "=" + query[key] + "&";
        }
        return url;
    }
}
