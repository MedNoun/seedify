
import { Socket } from 'dgram';
import URLParse, { URLPart } from 'url-parse';
import * as dgram from 'dgram';

export class TrackerManager {
    
    trackerUDPUrl: string

    constructor(trackerUDPUrl: string) {
        this.trackerUDPUrl = trackerUDPUrl
    }

    public parseUrl(url: string) {
        const parsedURL = URLParse(url);
        console.log('the parsed url is :', parsedURL)
        return parsedURL
    }

    public udpSendRequest(socket: Socket, request: any, url: any) {
        socket.send(request, 0, request.length, url.port, url.hostname, (data) => {
            console.log("the data is :", data)
        })
    }


    // the object returned from parsed url is :
    // {
    //     slashes: true,
    //     protocol: 'udp:',
    //     hash: '',
    //     query: '',
    //     pathname: '',
    //     auth: '',
    //     host: 'tracker.coppersurfer.tk:6969',
    //     port: '6969',
    //     hostname: 'tracker.coppersurfer.tk',
    //     password: '',
    //     username: '',
    //     origin: 'null',
    //     href: 'udp://tracker.coppersurfer.tk:6969'
    //   }


}
