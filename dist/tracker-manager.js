var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import URLParse from "url-parse";
import * as dgram from "dgram";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { ActionsType } from "./types/requestActions.js";
import { randomBytes } from "crypto";
import { TorrentParser } from "./torrent-parser.js";
export class TrackerManager {
    constructor(torrent) {
        this.torrentParser = new TorrentParser(torrent);
        this.socket = dgram.createSocket("udp4");
    }
    respType(resp) {
        const action = resp.readUInt32BE(0);
        console.log("the action :", action);
        if (action === 0)
            return "connect";
        if (action === 1)
            return "announce";
        if (action === 2)
            return "scrape";
        if (action === 3)
            return "error";
    }
    genId() {
        if (!this.id) {
            this.id = crypto.randomBytes(20);
            Buffer.from("-AT0001-").copy(this.id, 0);
        }
        return this.id;
    }
    getPeers(callback = (r) => {
        console.log("response : ", r);
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. send connect request
            this.udpSendRequest(this.connectRequest());
            this.socket.on("message", (response) => {
                if (this.respType(response) === "connect") {
                    // 2. receive and parse connect response
                    const connResp = this.parseConnectResponse(response);
                    // 3. send announce request
                    const announceReq = this.announceRequest(connResp.connectionId);
                    this.udpSendRequest(announceReq);
                }
                else if (this.respType(response) === "announce") {
                    // 4. parse announce response
                    const announceResp = this.parseAnnounceResponse(response);
                    // 5. pass peers to callback
                    callback(announceResp);
                }
                else if (this.respType(response) === "error") {
                    console.log('error in the response !');
                }
            });
        });
    }
    parseUrl(url) {
        return URLParse(url);
    }
    udpSendRequest(request) {
        const url = this.parseUrl(this.torrentParser.mainUdpUrl);
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (err, bytes) => {
            if (err)
                throw err;
        });
        this.socket.on("error", (err) => {
            console.error("Socket error:", err);
        });
        //hedhy normalement zeyda twali hasb mazedt enty fel code lfouk chouf ctrl + f 'haza2' mr mohamed
        this.socket.on("message", (response, rinfo) => {
            console.log("I ama here with response type :", this.respType(response));
        });
    }
    connectRequest() {
        const connectRequestBuffer = Buffer.allocUnsafe(16);
        /**
         * the connection id have 3 main parameters : (connectionId , the action, transactionId)
        */
        //setting the default value of the connectionId
        connectRequestBuffer.writeUInt32BE(0x417, 0);
        connectRequestBuffer.writeUint32BE(0x27101980, 4);
        //setting the action for connect action
        connectRequestBuffer.writeUint32BE(ActionsType.connect, 8);
        //generate the random transactionId
        randomBytes(4).copy(connectRequestBuffer, 12);
        return connectRequestBuffer;
    }
    parseConnectResponse(connectResponse) {
        const action = connectResponse.readUint32BE(0);
        const transactionId = connectResponse.readUint32BE(4);
        const connectionId = connectResponse.slice(8);
        let parsedConnectResponse = {
            action: action,
            transactionId: transactionId,
            connectionId: connectionId,
        };
        return parsedConnectResponse;
    }
    announceRequest(connId, port = 6881) {
        const buf = Buffer.allocUnsafe(98);
        connId.copy(buf, 0);
        // action
        buf.writeUInt32BE(ActionsType.announce, 8);
        // transaction id
        crypto.randomBytes(4).copy(buf, 12);
        // info hash
        this.torrentParser.infoHash.copy(buf, 16);
        // peerId
        this.genId().copy(buf, 36);
        // downloaded
        Buffer.alloc(8).copy(buf, 56);
        // left
        this.torrentParser.size.copy(buf, 64);
        // uploaded
        Buffer.alloc(8).copy(buf, 72);
        // event
        buf.writeUInt32BE(0, 80);
        // ip address
        buf.writeUInt32BE(0, 84);
        // key
        crypto.randomBytes(4).copy(buf, 88);
        // num want
        buf.writeInt32BE(-1, 92);
        // port
        buf.writeUInt16BE(port, 96);
        return buf;
    }
    getBufferUInt64BE(n) {
        let buf = Buffer.alloc(8);
        buf.writeUint32BE(n, 4);
    }
    parseAnnounceResponse(resp) {
        function group(iterable, groupSize) {
            let groups = [];
            for (let i = 0; i < iterable.length; i += groupSize) {
                groups.push(iterable.slice(i, i + groupSize));
            }
            return groups;
        }
        return {
            action: resp.readUInt32BE(0),
            transactionId: resp.readUInt32BE(4),
            leechers: resp.readUInt32BE(8),
            seeders: resp.readUInt32BE(12),
            peers: group(resp.slice(20), 6).map((address) => {
                return {
                    ip: address.slice(0, 4).join("."),
                    port: address.readUInt16BE(4),
                };
            }),
        };
    }
    parseError(error) {
        return {
            action: error.readUInt32BE(0),
            transactionId: error.readUInt32BE(4),
            message: error.readUInt32BE(8)
        };
    }
}
