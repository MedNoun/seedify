import { TorrentParser } from "./TorrentParser.js";
import { Tracker } from "./Tracker.js";
import { TorrentMetadata } from "./types/TorrentMetadata.js";

export class Torrent {
    public metadata: TorrentMetadata;
    public trackers: Tracker[] = [];
    public peers: any[] = [];

    constructor(
        public file: string,
        public clientId: string,
        public port: number,
        public uploaded = 0,
        public downloaded = 0
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
        }
    }
}
