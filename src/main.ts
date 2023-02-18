
import URLParse from 'url-parse';
import { TrackerManager } from './tracker-manager.js';
import * as dgram from 'dgram';


const trackerManager = new TrackerManager("src/torrent-files/t9.torrent")

trackerManager.udpSendRequest("hello",(response)=>{console.log('my response is :', response)});
