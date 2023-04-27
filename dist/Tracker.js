var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Http, Udp } from "./network.js";
import { TrackerState } from "./types/TrackerState.js";
export class Tracker {
    constructor(url, torrent, state = TrackerState.STOPPED) {
        this.torrent = torrent;
        this.state = state;
        this.url = new URL(url);
        if (this.url.protocol === "udp:") {
            this.network = new Udp();
        }
        else {
            this.network = new Http();
        }
    }
    announce(trackerEvent) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = TrackerState.CONNECTING;
            const resp = yield this.network.connect(this.url, trackerEvent, this.torrent);
            return resp;
        });
    }
}
Tracker.events = {
    STARTED: "started",
    COMPLETED: "completed",
    STOPPED: "stopped",
};
