import { TrackerManager } from './tracker-manager.js';
const trackerManager = new TrackerManager("src/torrent-files/t9.torrent");
trackerManager.udpSendRequest(trackerManager.connectRequest(), (response) => { console.log('my response is :', response); });
