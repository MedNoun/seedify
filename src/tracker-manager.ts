
import * as fs from 'fs';
import bencode from 'bencode'
import { Socket } from 'dgram';
import URLParse, { URLPart } from 'url-parse';
import * as dgram from 'dgram';
import Tracker from './types/tracker';
import Announce from './types/announce';
import { Buffer } from 'buffer'
import { ActionsType } from './types/requestActions.js';
import { randomBytes } from 'crypto';
import connectRespoonse from './types/connect-response';


export class TrackerManager {
    private tracker: Tracker;
    private socket: Socket;
    constructor(torrent: string) {
        const torrentFileContent = fs.readFileSync(torrent);
        this.tracker = bencode.decode(torrentFileContent, "utf8")
        this.socket = dgram.createSocket("udp4");
    }

    public parseUrl(url: string) {
        return URLParse(url);
    }

    public udpSendRequest(request: any, callback: Function) {

        const url = this.parseUrl(this.tracker['announce-list'][2])
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (err, bytes) => {
            if (err) throw err
        })
        this.socket.on('error', (err) => {
            console.error('Socket error:', err);
        });
        this.socket.on("message", (msg, rinfo) => {
            this.parseConnectResponse(msg)
            console.log('the other is :', rinfo)
        })
    }

    public connectRequest() {
        const connectRequestBuffer = Buffer.allocUnsafe(16)
        /**
         * the connection id have 3 main parameters : (connectionId , the action, transactionId)
        */
        //setting the default value of the connectionId
        connectRequestBuffer.writeUInt32BE(0x417, 0)
        connectRequestBuffer.writeUint32BE(0x27101980, 4)
        //setting the action for connect action
        connectRequestBuffer.writeUint32BE(ActionsType.connect, 8)
        //generate the random transactionId
        randomBytes(4).copy(connectRequestBuffer, 12)
        return connectRequestBuffer
    }

    public parseConnectResponse(connectResponse: Buffer) {

        const action = connectResponse.readUint32BE(0)
        const transactionId = connectResponse.readUint32BE(4)
        const connectionId = connectResponse.readUint32BE(8)
        let parsedConnectResponse: connectRespoonse = {
            action: action,
            transactionId: transactionId,
            connectionId: connectionId
        }
        return parsedConnectResponse
    }
}
