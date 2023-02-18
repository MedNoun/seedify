import * as fs from 'fs';
import bencode from 'bencode';
import URLParse from 'url-parse';
import * as dgram from 'dgram';
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
        const url = this.parseUrl(this.tracker['announce-list'][1]);
        this.socket.send(request, 0, request.length, Number(url.port), url.hostname, (data) => {
            console.log("the data is :", data);
        });
        console.log("callback : ", typeof callback);
        this.socket.on("message", (response) => { callback(response); });
    }
}
