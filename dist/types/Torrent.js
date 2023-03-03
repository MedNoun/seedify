export class Torrent {
    constructor(announce, announceList, fileName, pieceLength, pieces, info, infoHash, files, length, encoding) {
        this.announce = announce;
        this.announceList = announceList;
        this.fileName = fileName;
        this.pieceLength = pieceLength;
        this.pieces = pieces;
        this.info = info;
        this.infoHash = infoHash;
        this.files = files;
        this.length = length;
        this.encoding = encoding;
    }
}
