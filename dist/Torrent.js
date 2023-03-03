var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TorrentParser } from "./TorrentParser.js";
import { Tracker } from "./Tracker.js";
export class Torrent {
    constructor(file, clientId, port, uploaded = 0, downloaded = 0) {
        this.file = file;
        this.clientId = clientId;
        this.port = port;
        this.uploaded = uploaded;
        this.downloaded = downloaded;
        this.trackers = [];
        this.peers = [];
        this.metadata = TorrentParser.instance.parse(file);
        this.start();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.metadata.announce) {
                this.trackers.push(new Tracker(this.metadata.announce, this));
            }
            if (this.metadata.announceList) {
                for (const a of this.metadata.announceList) {
                    this.trackers.push(new Tracker(a, this));
                }
            }
            for (const t of this.trackers) {
                const resp = yield t.announce(Tracker.events.STARTED);
                console.log(resp);
            }
        });
    }
}
