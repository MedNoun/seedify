import * as fs from 'fs';
import bencode from 'bencode';
import URLParse from 'url-parse';
import * as dgram from 'dgram';
import { Buffer } from 'buffer';
import { ActionsType } from './types/requestActions.js';
import { randomBytes } from 'crypto';
export class TrackerManager {
    constructor(torrent) {
        const torrentFileContent = fs.readFileSync(torrent);
        this.tracker = bencode.decode(torrentFileContent, "utf8");
        this.socket = dgram.createSocket("udp4");
    }
    parseUrl(url) {
        return URLParse(url);
    }
    udpSendRequest(request, callback) {
        const url = this.parseUrl(this.tracker['announce-list'][2]);
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (err, bytes) => {
            if (err)
                throw err;
        });
        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
        this.socket.on("message", (msg, rinfo) => { console.log("the response is : ", msg); });
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
}
