import { Torrent } from './Torrent.js';
import { Seeder } from './seeder.js';





export class Client {
  clientId: string
  port: number
  torrents
  seeder: Seeder
  constructor(options: any) {
    this.clientId =
      options.clientId || "-AMVK01-" + Math.random().toString().slice(2, 14);
    this.port = options.port || 6882;
    this.torrents = {};
    this.seeder = new Seeder(this.port, this);
  }

  closeSeeder = () => {
    this.seeder.server.close();
    this.seeder = null;
  };

  addTorrent = (filename, options) => {
    const t = new Torrent(filename, this.clientId, this.port, options);
    if (!this.torrents[t.metadata.infoHash]) {
      this.torrents[t.metadata.infoHash] = t;
    }
    return t;
  };

  removeTorrent = (torrent) => {
    delete this.torrents[torrent.metadata.infoHash];
  };
}


