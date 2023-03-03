import { Torrent } from "./Torrent.js";
class Options {
    constructor(id = "-AMVK01-" + Math.random().toString().slice(2, 14), port = 6882) {
        this.id = id;
        this.port = port;
    }
}
export class Client {
    constructor(options = new Options()) {
        this.torrents = new Map();
        this.id = options.id;
        this.port = options.port;
    }
    addTorrent(file) {
        const torrent = new Torrent(file, this.id, this.port);
        if (!this.torrents.has(torrent.metadata.infoHash)) {
            this.torrents.set(torrent.metadata.infoHash, torrent);
        }
        return torrent;
    }
    removeTorrent(torrent) {
        this.torrents.delete(torrent.metadata.infoHash);
    }
}
