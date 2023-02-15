import * as fs from 'fs';
import bencode from 'bencode'
import URLParse from 'url-parse';


function readFile(torrentFilePath: string) {
    const torrentFileContent = fs.readFileSync(torrentFilePath);
    const torrentFileContentDecoded = bencode.decode(torrentFileContent,"utf8")
    console.log("the url is :" , torrentFileContentDecoded.announce);
    console.log("the parsed url is :",URLParse(torrentFileContentDecoded.announce));
}
readFile("src/torrent-files/t9.torrent")