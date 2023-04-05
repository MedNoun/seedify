import { Torrent } from "./Torrent.js";
import axios from "axios";
import crypto from "crypto";
import bencode from "bencode";
import dgram from "dgram";
import { Tracker } from "./Tracker.js";
import { Peer } from "./peer.js";

export abstract class Network {
    public abstract connect(url: URL, event: string, torrent: Torrent);
    protected getPeersList(resp) {
        let peersList = [];
        if (Buffer.isBuffer(resp)) {
            for (let i = 0; i < resp.length; i += 6) {
                peersList.push({
                    ip: resp.subarray(i, i + 4).join("."),
                    port: resp.readUInt16BE(i + 4),
                });
            }
        } else {
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
    static actions = {
        CONNECT: 0,
        ANNOUNCE: 1,
        SCRAPE: 2,
        ERROR: 3,
    };
    constructor(
        public transactionId = crypto.randomBytes(4),
        public connectionId = null
    ) {
        super();
    }
    public async connect(url: URL, event: string, torrent: Torrent) {
        const { port, hostname } = url;
        const socket = dgram.createSocket("udp4");
        socket.send(this.connectPayload, Number(port), hostname);
        const resp = await new Promise((resolve, reject) => {

            const timeoutID = setTimeout(
                () => reject('longCalculation took too long'),
                10000
            );
            socket.on("message", (msg) => {
                if (msg.length < 16) return reject();
                let action = msg.readUInt32BE(0);
                let respTransId = msg.subarray(4, 8);

                if (this.transactionId.compare(respTransId)) return reject();

                switch (action) {
                    case Udp.actions.CONNECT:
                        this.connectionId = msg.subarray(8);
                        const announcePayload = this.announcePayload(
                            event,
                            torrent
                        );
                        socket.send(announcePayload, Number(port), hostname);
                        break;

                    case Udp.actions.ANNOUNCE:
                        socket.close();
                        if (msg.length < 20) reject();
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
            })
        }
        ).catch(e => {
            console.log("error : ", e);

        });
        return resp;
    }
    private get connectPayload() {
        const payload = Buffer.alloc(16);
        payload.writeUInt32BE(0x417, 0);
        payload.writeUInt32BE(0x27101980, 4);
        payload.writeUInt32BE(Udp.actions.CONNECT, 8);
        this.transactionId.copy(payload, 12);
        return payload;
    }
    private parseResponse(resp) {
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
    private getBufferUInt64BE(n) {
        const buf = Buffer.alloc(8);
        // buf.writeUInt32BE(n >>> 32, 0);
        // buf.writeUInt32BE(n && 0xffffffff, 4);
        buf.writeUInt32BE(n, 4);
        return buf;
    }
    private announcePayload(event: string, torrent: Torrent) {
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
        if (event === Tracker.events.COMPLETED) e = 1;
        else if (event === Tracker.events.STARTED) e = 2;
        else if (event === Tracker.events.STOPPED) e = 3;
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
export class Http extends Network {
    constructor() {
        super();
    }
    public async connect(link: URL, event: string, torrent: Torrent) {
        const url = this.createUrl(link, event, torrent);
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            transformResponse: [],
        });
        return this.parseResponse(response.data);
    }
    private parseResponse(resp) {
        const responseInfo = bencode.decode(resp);
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
    private createUrl(link: URL, event: string, torrent: Torrent) {
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
