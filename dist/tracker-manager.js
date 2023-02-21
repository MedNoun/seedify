import URLParse from 'url-parse';
import * as dgram from 'dgram';
import { Buffer } from 'buffer';
import { ActionsType } from './types/requestActions.js';
import { randomBytes } from 'crypto';
import { TorrentParser } from './torrent-parser.js';
export class TrackerManager {
    constructor(torrent) {
        this.torrentParser = new TorrentParser(torrent);
        this.socket = dgram.createSocket("udp4");
    }
    parseUrl(url) {
        return URLParse(url);
    }
    udpSendRequest(request, callback) {
        const url = this.parseUrl(this.torrentParser.getMainUdpUrl());
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (err, bytes) => {
            if (err)
                throw err;
        });
        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
        this.socket.on("message", (msg, rinfo) => {
            this.parseConnectResponse(msg);
            console.log('the other is :', rinfo);
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
        const connectionId = connectResponse.readUint32BE(8);
        let parsedConnectResponse = {
            action: action,
            transactionId: transactionId,
            connectionId: connectionId
        };
        return parsedConnectResponse;
    }
    announceRequest() {
    }
    parseAnnounceRequest() {
    }
}
