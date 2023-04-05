var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Peer } from "./peer.js";
import { TorrentParser } from "./TorrentParser.js";
import { Tracker } from "./Tracker.js";
import { PeerState } from "./types/peerState.enum.js";
export class Torrent {
    constructor(file, clientId, port, uploaded = 0, downloaded = 0, mode = Torrent.modes.DEFAULT, missingPieces = {}) {
        this.file = file;
        this.clientId = clientId;
        this.port = port;
        this.uploaded = uploaded;
        this.downloaded = downloaded;
        this.mode = mode;
        this.missingPieces = missingPieces;
        this.trackers = [];
        this.peers = [];
        this.metadata = TorrentParser.instance.parse(file);
        this.start();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            let x = 0;
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
                const resp = yield t.announce(Tracker.events.STARTED);
                console.log(resp);
                if (resp) {
                    for (let p of resp.peerList) {
                        const peer = new Peer(p.ip, p.port, new PeerState(), this);
                        this.peers.push(peer);
                        peer.connect();
                    }
                }
            }
        });
    }
}
Torrent.modes = {
    DEFAULT: "default",
    ENDGAME: "endgame",
    COMPLETED: "completed",
};
