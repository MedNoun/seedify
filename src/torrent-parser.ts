import * as fs from "fs";
import * as crypto from "crypto";
import { toBufferBE, toBufferLE } from "bigint-buffer";
import bencode from "bencode";
import BigNum from "bignum";

export class  TorrentParser {
  private torrentFilePath: string;
  // there is an interface already implemented for the content use it next time "tracker.ts"
  private torrentFileContent: any;

  constructor(torrentFilePath: string) {
    this.torrentFilePath = torrentFilePath;
    this.torrentFileContent = bencode.decode(
      fs.readFileSync(this.torrentFilePath),
      
    );
    console.log("content : ", this.torrentFileContent);
  }
  public get infoHash() {
    console.log("the infii before the hash is : " , this.info )
    return crypto
      .createHash("sha1")
      .update(bencode.encode(this.info))
      .digest();
  } 

  public get size() {
    const size = this.torrent.info.files
      ? this.torrent.info.files
          .map((file) => file.length)
          .reduce((a, b) => a + b)
      : this.torrent.info.length;
    return BigNum.toBuffer(size , {size : 8,endian : 'little'})
  }

  public get torrent() {
    return this.torrentFileContent;
  }

  public get trackersUrls() {
    return this.torrentFileContent["announce-list"];
  }

  public get mainUdpUrl() {
    return this.torrentFileContent["announce-list"][2];
  }

  public get announceUrl() {
    return this.torrentFileContent["announce"];
  }

  public get info() {
    return this.torrentFileContent["info"];
  }

  public get pieces() {
    return this.torrentFileContent.info["pieces"];
  }
  
}
