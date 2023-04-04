import { Torrent } from "./Torrent.js";

class Options {
    constructor(
        public id: string = "-AMVK01-" + Math.random().toString().slice(2, 14),
        public port: number = 6882
    ) {}
}
export class Client {
    public id: string;
    public port: number;
    public torrents = new Map<any, Torrent>();
    constructor(options: Options = new Options()) {
        this.id = options.id;
        this.port = options.port;
    }
    public addTorrent(file: string) {
        const torrent = new Torrent(file, this.id, this.port);
        if (!this.torrents.has(torrent.metadata.infoHash)) {
            this.torrents.set(torrent.metadata.infoHash, torrent);
        }
        return torrent;
    }
    public removeTorrent(torrent: Torrent) {
        this.torrents.delete(torrent.metadata.infoHash);
    }
}
