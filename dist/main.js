import { Client } from "./Client.js";
import { Bar, Presets } from 'cli-progress';
const client = new Client();
const progressBar = new Bar({
    format: "\x1b[40m\x1b[35mTorrent Progress\x1b[32m {bar} \x1b[31m{percentage}% | \x1b[36mETA: {eta}s |\x1b[33m {value}/{total}" +
        " \x1b[37mSpeed: {Speed} | \x1b[33m Peers: {peers}",
}, Presets.shades_classic);
progressBar.start(10, 0, { Speed: "N/A", peers: 0 });
client.addTorrent("dist/torrents/t1.torrent");
