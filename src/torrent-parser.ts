

import * as fs from 'fs';
import bencode from 'bencode'

export class TorrentParser {

    private torrentFilePath: string
    private torrentFileContent: any

    constructor(torrentFilePath: string) {
        this.torrentFilePath = torrentFilePath
        this.torrentFileContent = bencode.decode(fs.readFileSync(this.torrentFilePath), "utf8")
    }

    public getTrackersUrls() {
        return this.torrentFileContent["announce-list"]
    }

    public getMainUdpUrl() {
        return this.torrentFileContent['announce-list'][2]
    }

    public getAnnounceUrl() {
        return this.torrentFileContent["announce"]
    }

    public getInfo() {
        return this.torrentFileContent["info"]
    }

    public getPieces() {
        return this.torrentFileContent.info["pieces"]
    }
}