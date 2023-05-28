import { Torrent } from './Torrent.js';
import { Seeder } from './seeder.js';
export class Client {
    constructor(options) {
        this.closeSeeder = () => {
            this.seeder.server.close();
            this.seeder = null;
        };
        this.addTorrent = (filename, options) => {
            const t = new Torrent(filename, this.clientId, this.port, options);
            if (!this.torrents[t.metadata.infoHash]) {
                this.torrents[t.metadata.infoHash] = t;
            }
            return t;
        };
        this.removeTorrent = (torrent) => {
            delete this.torrents[torrent.metadata.infoHash];
        };
        this.clientId =
            options.clientId || "-AMVK01-" + Math.random().toString().slice(2, 14);
        this.port = options.port || 6882;
        this.torrents = {};
        this.seeder = new Seeder(this.port, this);
    }
}
