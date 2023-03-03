export class TorrentMetadata {
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
