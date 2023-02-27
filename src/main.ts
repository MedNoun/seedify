import { TrackerManager } from "./tracker-manager.js";

const trackerManager = new TrackerManager("src/torrent-files/t9.torrent");
trackerManager.httpConnectRequest().then((response) => {console.log('walah khdemt aman');
})
// trackerManager.getPeers();
