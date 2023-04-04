export interface Info {
  length: number;
  name: Buffer;
  pieces: Buffer;
  private: number;
}
export class TorrentMetadata {
  constructor(
    public announce: string,
    public announceList: string[],
    public fileName: string,
    public pieceLength: number,
    public pieces: Buffer,
    public info: Info,
    public infoHash: Buffer,
    public files: any,
    public length: number,
    public encoding: Buffer
  ) {}
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
