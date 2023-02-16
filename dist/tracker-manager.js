import URLParse from 'url-parse';
export class TrackerManager {
    constructor(trackerUDPUrl) {
        this.trackerUDPUrl = trackerUDPUrl;
    }
    parseUrl(url) {
        const parsedURL = URLParse(url);
        console.log('the parsed url is :', parsedURL);
        return parsedURL;
    }
    udpSendRequest(socket, request, url) {
        socket.send(request, 0, request.length, url.port, url.hostname, (data) => {
            console.log("the data is :", data);
        });
    }
}
