import { Peer } from "./peer.js";
import { TorrentParser } from "./TorrentParser.js";
import { Tracker } from "./Tracker.js";
import { PeerState } from "./types/peerState.enum.js";
import { TorrentMetadata } from "./types/TorrentMetadata.js";

export class Torrent {
    public metadata: TorrentMetadata;
    public trackers: Tracker[] = [];
    public peers: Peer[] = [];
    static modes = {
        DEFAULT: "default",
        ENDGAME: "endgame",
        COMPLETED: "completed",
    };
    constructor(
        public file: string,
        public clientId: string,
        public port: number,
        public uploaded = 0,
        public downloaded = 0,
        public mode = Torrent.modes.DEFAULT,
        public missingPieces = {}
    ) {
        this.metadata = TorrentParser.instance.parse(file);
        this.start();
    }
    public async start() {
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
            const resp = await t.announce(Tracker.events.STARTED);

            console.log(resp);
            if (resp) {
                for (let p of resp.peerList) {
                    const peer = new Peer(p.ip, p.port, new PeerState(), this)
                    this.peers.push(peer)
                    peer.connect()
                }
            }


        }
    }
}
