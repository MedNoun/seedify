import { Peer } from './peer.js';
import net from "net";
export class Seeder {
    constructor(port, client) {
        this.handleConnection = (sock) => {
            const { address, port } = sock.address();
            console.info("seeder received a connection", address);
            const peer = new Peer(address, port, null, sock, (infoHash) => {
                const torrent = this.client.torrents[infoHash];
                if (!torrent) {
                    peer.disconnect("peer requesting unknown torrent. disconnecting");
                }
                else {
                    // peer.handleLeecher(torrent);
                    console.log("I am trying to handle leecher but i can not !");
                }
            });
            peer.start();
        };
        this.port = port;
        this.client = client;
        this.server = net.createServer((sock) => this.handleConnection(sock));
        this.server.on("listening", () => {
            console.log("Server is listening");
        });
        this.server.on("error", (err) => {
            console.log(err);
        });
        this.server.listen(this.port);
    }
}
