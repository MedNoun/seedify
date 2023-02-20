import * as fs from 'fs';
import bencode from 'bencode';
export class TorrentParser {
    constructor(torrentFilePath) {
        this.torrentFilePath = torrentFilePath;
        this.torrentFileContent = bencode.decode(fs.readFileSync(this.torrentFilePath), "utf8");
        console.log(this.torrentFileContent);
    }
    getTrackersUrls() {
        return this.torrentFileContent["announce-list"];
    }
    getMainUdpUrl() {
        return this.torrentFileContent['announce-list'][2];
    }
    getAnnounceUrl() {
        return this.torrentFileContent["announce"];
    }
    getInfo() {
        return this.torrentFileContent["info"];
    }
    getPieces() {
        return this.torrentFileContent.info["pieces"];
    }
}
