import { Http, Network, Udp } from "./network.js";
import { Torrent } from "./Torrent.js";
import { TrackerState } from "./types/TrackerState.js";

export class Tracker {
    static events = {
        STARTED: "started",
        COMPLETED: "completed",
        STOPPED: "stopped",
    };
    public url: URL;
    public network: Network;
    constructor(
        url: string,
        public torrent: Torrent,
        public state: TrackerState = TrackerState.STOPPED
    ) {
        this.url = new URL(url);
        if (this.url.protocol == "udp:") {
            this.network = new Udp();
        } else {
            this.network = new Http();
        }
    }
    public async announce(trackerEvent: string) {
        this.state = TrackerState.CONNECTING;
        const resp = await this.network.connect(
            this.url,
            trackerEvent,
            this.torrent
        );

        return resp;
    }
}
