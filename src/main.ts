
import URLParse from 'url-parse';
import { TrackerManager } from './tracker-manager.js';
import * as dgram from 'dgram';
import { TorrentParser } from './torrent-parser.js';

const trackerManager = new TrackerManager("src/torrent-files/t9.torrent")

trackerManager.udpSendRequest(trackerManager.connectRequest(), (response) => { console.log('my response is :', response) });
