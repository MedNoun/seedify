import * as fs from 'fs';
import bencode from 'bencode';
import { TrackerManager } from './tracker-manager.js';
import * as dgram from 'dgram';
function getUrl(torrentFilePath) {
    const torrentFileContent = fs.readFileSync(torrentFilePath);
    const torrentFileContentDecoded = bencode.decode(torrentFileContent, "utf8");
    const trackerUDPUrl = torrentFileContentDecoded["announce-list"][1];
    console.log("haha", torrentFileContentDecoded);
    return trackerUDPUrl;
}
const url = getUrl("src/torrent-files/t9.torrent");
const trackerManager = new TrackerManager("src/torrent-files/t9.torrent");
const parsedUrl = trackerManager.parseUrl(url);
console.log("parsed : ", parsedUrl);
const socket = dgram.createSocket("udp4");
trackerManager.udpSendRequest(socket, "hello", parsedUrl);
socket.on("message", (response) => {
    console.log('my response is :', response);
});
