
import * as fs from 'fs';
import bencode from 'bencode'
import { Socket } from 'dgram';
import URLParse, { URLPart } from 'url-parse';
import * as dgram from 'dgram';
import Tracker from './types/tracker';
import Announce from './types/announce';

export class TrackerManager {
    private tracker : Tracker;
    private socket: Socket;
    constructor(torrent: string) {
        const torrentFileContent = fs.readFileSync(torrent);
        this.tracker = bencode.decode(torrentFileContent, "utf8")
        this.socket = dgram.createSocket("udp4");
    }

    public parseUrl(url: string)  {
        return URLParse(url); 
    }

    public udpSendRequest(request: any,callback: Function) {
        const url = this.parseUrl(this.tracker['announce-list'][1])
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (data) => {
            console.log("the data is :", data)
        })
        this.socket.on("message",(response)=>{callback(response)})
    }

}
