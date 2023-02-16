import * as fs from 'fs';
import bencode from 'bencode'
import URLParse from 'url-parse';
import { TrackerManager } from './tracker-manager.js';
import * as dgram from 'dgram';


function getUrl(torrentFilePath: string) {
    const torrentFileContent = fs.readFileSync(torrentFilePath);
    const torrentFileContentDecoded = bencode.decode(torrentFileContent, "utf8")
    const trackerUDPUrl = torrentFileContentDecoded["announce-list"][1]
    return trackerUDPUrl
}

const url = getUrl("src/torrent-files/t9.torrent")
const trackerManager = new TrackerManager("src/torrent-files/t9.torrent")
const parsedUrl = trackerManager.parseUrl(url);
const socket = dgram.createSocket("udp4");

trackerManager.udpSendRequest(socket, "hello", parsedUrl);
socket.on("message", (response) => {
    console.log('my response is :', response)
})