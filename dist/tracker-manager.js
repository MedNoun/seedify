import * as fs from 'fs';
import bencode from 'bencode';
import URLParse from 'url-parse';
export class TrackerManager {
    constructor(torrent) {
        const torrentFileContent = fs.readFileSync(torrent);
        const torrentFileContentDecoded = bencode.decode(torrentFileContent, "utf8");
        const parsedURL = URLParse(torrentFileContentDecoded.announce);
        console.log('the parsed url is :', parsedURL);
    }
    parseUrl(url) {
        const parsedURL = URLParse(url);
        console.log('the parsed url is :', parsedURL);
        return parsedURL;
    }
    udpSendRequest(socket, request, url) {
        socket.send(request, 0, request.length, url.port, url.hostname, (data) => {
            console.log("the data is :", data);
        });
    }
}
