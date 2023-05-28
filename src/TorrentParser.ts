import * as fs from "fs";
import * as crypto from "crypto";
import bencode from "bencode";
import { TorrentMetadata } from "./types/TorrentMetadata.js";


/* Structure of object returned by bencode
 * announce          : the URL of the tracker
 * info              : ordered dictionary containing key and values
 * files         : list of directories each containg files (in case of multile files)
 * length    : length of file in bytes
 * path      : contains path of each file
 * length        : length of the file (in case of single files)
 * name          : name of the file
 * piece length  : number of bytes per piece
 * pieces        : list of SHA1 hash of the given files
 */

export function getInfoHash(rawInfo) {
    console.log("infooooooo before the hashing :", rawInfo)
    let shasum = crypto.createHash("sha1");
    shasum.update(bencode.encode(rawInfo));
    return shasum.digest();
};

export function getMetaData(torrentData) {
    // console.log(torrentData);
    let announce;
    if (torrentData.announce) {
        announce = torrentData.announce.toString("utf-8");
    }
    let announceList = torrentData["announce-list"];
    if (announceList) {
        announceList = announceList.reduce((res, url_list) => {
            res.push(...url_list.map((url) => url.toString("utf-8")));
            return res;
        }, []);
    }
    let infos = torrentData["info"]
    let files = infos.files;
    let totalLength = 0;
    if (files) {
        for (let i = 0; i < files.length; i++) {
            totalLength += files[i].length;
            files[i].path = files[i].path.map((buf) => buf.toString("utf-8"));
        }
    }
    const metadata = {
        announce: announce,
        announceList: announceList,
        fileName: infos.name.toString("utf-8"),
        pieceLength: infos["piece length"],
        pieces: infos.pieces,
        info: infos,
        infoHash: getInfoHash(infos),
        files: files,
        length: files ? totalLength : infos.length,
        encoding: torrentData.encoding,
    };
    return metadata;
}

export const parse_torrent = (filename) => {
    const torrentFile = fs.readFileSync(filename);
    const torrentData = bencode.decode(torrentFile);
    return getMetaData(torrentData);
};

