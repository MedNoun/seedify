import { Piece } from './piece.js';
import { Peer } from "./peer.js";

import { TorrentParser } from "./TorrentParser.js";
import { Tracker } from "./Tracker.js";
import { PeerState } from "./types/peerState.enum.js";
import { TorrentMetadata } from "./types/TorrentMetadata.js";
import { File } from "./file.js"
import * as fs from "fs";
import * as path from 'path'


export class Torrent {
    public metadata: TorrentMetadata;
    public trackers: Tracker[] = [];
    public peers: Peer[] = [];
    static modes = {
        DEFAULT: "default",
        ENDGAME: "endgame",
        COMPLETED: "completed",
    };
    public downloadPath = "../downloads/"
    constructor(
        public file: string,
        public clientId: string,
        public port: number,
        public uploaded = 0,
        public downloaded = 0,
        public mode = Torrent.modes.DEFAULT,
        public pieces : Piece[] = [],
        public missingPieces = {},
        public cb = null,
        public files = []
    ) {
        this.metadata = TorrentParser.instance.parse(file);
        console.log("the torrent content :", this)
        console.log("toul l metadata :", this.metadata.pieces.length)
        this.start();
    }

    updateState = () => {
        let numDone = 0;
        let numActive = 0;
        for (const p of this.pieces) {
            if (p.state === Piece.states.COMPLETE) numDone++;
            else if (p.state === Piece.states.ACTIVE) numActive++;
        }
        this.cb("progress", { numDone });
        if (numDone === this.pieces.length) {
            this.mode = Torrent.modes.COMPLETED;
            this.cb("completed");
            //   this.shutdown();
            console.log("i want to shutdown but it is not implemented")
        }
    }
    // shutdown = () => {
    //     this.peers.forEach((p) => p.disconnect());
    //     this.trackers.forEach((t) => t.shutdown());
    //     clearInterval(this.rateIntervalid);
    //     // if(t)
    //     const _closeFiles = () => {
    //       if (this.pieces.every((p) => p.saved)) {
    //         this.files.forEach((f) => f.close());
    //         this.cb("saved");
    //       } else {
    //         setTimeout(_closeFiles, 1000);
    //       }
    //     };
    //     _closeFiles();
    //   };


    get numPieces() {
        return this.metadata.pieces.length / 20;
    }

    public async start() {
        if (this.metadata.announce) {
            this.trackers.push(new Tracker(this.metadata.announce, this));

        }

        if (this.metadata.announceList) {
            for (let a of this.metadata.announceList) {
                const url = a.split("/");
                if (!url.pop().includes("announce")) {
                    a = a + "/announce";
                }
                this.trackers.push(new Tracker(a, this));
            }
        }
        for (const t of this.trackers) {
            const resp = await t.announce(Tracker.events.STARTED);

            console.log(resp);
            if (resp) {
                for (let p of resp.peerList) {
                    const peer = new Peer(p.ip,
                        p.port,
                        new PeerState(),
                        this, (infoHash) => {
                            console.log(infoHash)
                        })
                    this.peers.push(peer)
                    peer.connect()
                }
            }


        }
    }
    createPieces = () => {
        const { pieces, pieceLength, length } = this.metadata;
        const n = pieces.length / 20;
        let f = 0;

        for (let i = 0; i < n; i++) {
          const included = [];
          const pend = i * pieceLength + pieceLength;

          while (f < this.files.length) {
            included.push(this.files[f]);
            const fend = this.files[f].offset + this.files[f].length;
            if (pend < fend) break;
            else if (pend > fend) f++;
            else {
              f++;
              break;
            }
          }
          let len = pieceLength;
          if (i === n - 1 && length % pieceLength !== 0) {
            len = length % pieceLength;
          }
          this.pieces.push(
            new Piece(i, i * pieceLength,
              len,
              pieces.slice(i * 20, i * 20 + 20),
              included)
          );
        }
      };
    createFiles = () => {
        const dest = this.downloadPath + this.metadata.fileName;
        if (this.metadata.files) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, {recursive : true});
          }
          let offset = 0;
          for (const file of this.metadata.files) {
            const filedir = path.join(
              dest,
              ...file.path.slice(0, file.path.length - 1)
            );
            const filepath = path.join(filedir, file.path[file.path.length - 1]);
            if (!fs.existsSync(filedir)) {
              fs.mkdirSync(filedir, {recursive : true});
            }
            const f = new File(filepath, file.length, offset);
            f.open((err) => console.error(err));
            this.files.push(f);
            offset += file.length;
          }
        } else {
          if (!fs.existsSync(this.downloadPath)) {
            fs.mkdirSync(this.downloadPath, {recursive : true});
          }
          const f = new File(dest, this.metadata.length, 0);
          f.open((err) => console.error(err));
          this.files.push(f);
        }
      };
}
