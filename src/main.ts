import { Client } from "./Client.js";

const client = new Client();
console.log(client.addTorrent("dist/torrents/t1.torrent"));
