import * as fs from "fs";
import * as crypto from "crypto";
import bencode from "bencode";
import { TorrentMetadata } from "./types/TorrentMetadata.js";
export class TorrentParser {
    static get instance() {
        if (!TorrentParser.parser) {
            TorrentParser.parser = new TorrentParser();
        }
        return TorrentParser.parser;
    }
    getInfoHash(rawInfo) {
        let shasum = crypto.createHash("sha1");
        shasum.update(bencode.encode(rawInfo));
        return shasum.digest();
    }
    getMetadata(parsedTorrent) {
        let announce;
        if (parsedTorrent.announce) {
            announce = parsedTorrent.announce.toString("utf-8");
        }
        let announceList = parsedTorrent["announce-list"];
        if (announceList) {
            announceList = announceList.reduce((res, url_list) => {
                res.push(...url_list.map((url) => url.toString("utf-8")));
                return res;
            }, []);
        }
        const info = parsedTorrent["info"];
        let files = info.files;
        let totalLength = 0;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                totalLength += files[i].length;
                files[i].path = files[i].path.map((buf) => buf.toString("utf-8"));
            }
        }
        const metadata = new TorrentMetadata(announce, announceList, info.name.toString("utf-8"), info["piece length"], info.pieces, info, this.getInfoHash(info), files, files ? totalLength : info.length, parsedTorrent.encoding);
        return metadata;
    }
    parse(file) {
        const torrentFile = fs.readFileSync(file);
        const torrentData = bencode.decode(torrentFile);
        return this.getMetadata(torrentData);
    }
}
