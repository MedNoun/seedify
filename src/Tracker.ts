import { Torrent } from './Torrent.js';
import { Udp, Http } from './network.js';




const CONNECTING = "connecting";
const ERROR = "error";
const STOPPED = "stopped";
const WAITING = "waiting";

export class Tracker {
    static events = {
        STARTED: "started",
        COMPLETED: "completed",
        STOPPED: "stopped",
    };
    url: URL
    torrent: Torrent
    state: string
    intervalId: any
    handler: Udp | Http
    constructor(url, torrent) {
        this.url = new URL(url);
        this.torrent = torrent;
        this.state = STOPPED;
        this.intervalId = null;
        if (this.url.protocol === "udp:") {
            this.handler = new Udp(this);
        } else {
            this.handler = new Http(this);
        }
    }

    announce(event, cb) {
        this.state = CONNECTING;
        this.handler
            .connect(event)
            .then((data) => {
                this.state = WAITING;
                if (event === Tracker.events.STARTED) {
                    if (this.intervalId) {
                        clearInterval(this.intervalId);
                    }
                    if (data["interval"]) {
                        this.intervalId = setInterval(() => {
                            this.announce(null, cb);
                        }, data["interval"] * 1000);
                    }
                } else if (event === Tracker.events.STOPPED) {
                    clearInterval(this.intervalId);
                    this.intervalId = null;
                    this.state = STOPPED;
                }
                cb(null, data);
            })
            .catch((err) => {
                this.state = ERROR;
                if (event === Tracker.events.STARTED && err != "ENOTFOUND") {
                    setTimeout(() => this.announce(null, cb), 30000);
                } else {
                    this.shutdown();
                }
                cb(err);
            });
    }

    shutdown = () => {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    };


}


