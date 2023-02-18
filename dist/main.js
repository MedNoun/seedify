import { TrackerManager } from './tracker-manager.js';
import * as dgram from 'dgram';
const trackerManager = new TrackerManager("src/torrent-files/t9.torrent");
// const parsedUrl = trackerManager.parseUrl(url);
const socket = dgram.createSocket("udp4");
// trackerManager.udpSendRequest(socket, "hello", parsedUrl);
// socket.on("message", (response) => {
//     console.log('my response is :', response)
// })
