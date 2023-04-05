import { createConnection } from "net";
import { MessageFactory } from "./message-factory.js";
import { Statistic } from "./types/download-statistics.js";
import { msgId } from "./types/messagesId.enum.js";
export class Peer {
    constructor(ip, port, state, torrent, lastReceivedTime = undefined, statistic = new Statistic(), socket = createConnection({ host: ip, port: port }), buffer = Buffer.alloc(0), msgProcessing = false, handshakeDone = false) {
        this.ip = ip;
        this.port = port;
        this.state = state;
        this.torrent = torrent;
        this.lastReceivedTime = lastReceivedTime;
        this.statistic = statistic;
        this.socket = socket;
        this.buffer = buffer;
        this.msgProcessing = msgProcessing;
        this.handshakeDone = handshakeDone;
        this.handleHandshake = () => {
            const hs = MessageFactory.parseHandshake(this.buffer);
            if (hs.pstr == "BitTorrent protocol") {
                this.handshakeDone = true;
                console.log(`Handshake done for Peer  ${this.id}`);
            }
            // if (this.hscb) {
            //   this.hscb(hs.infoHash);
            // }
            this.buffer = this.buffer.slice(this.buffer.readUInt8(0) + 49);
        };
    }
    get id() {
        return this.ip + " : " + this.port;
    }
    connect() {
        this.socket.on("connect", () => {
            let handshake = MessageFactory.buildHandshakePacket(this.torrent.metadata.infoHash, this.torrent.clientId);
            this.socket.write(handshake);
        });
        this.socket.on("error", (err) => this.onError(err));
        this.socket.on("data", (data) => this.onData(data));
        // this.socket.on("end", () => this.onEnd());
    }
    onError(err) {
        console.log("errrrrrrrrrr : ", err);
    }
    onData(data) {
        this.lastReceivedTime = new Date().getTime();
        this.buffer = Buffer.concat([this.buffer, data]);
        if (this.msgProcessing)
            return;
        this.msgProcessing = true;
        while (this.isMsgComplete()) {
            if (this.handshakeDone) {
                this.handleMsg();
            }
            else {
                this.handleHandshake();
            }
        }
        this.msgProcessing = false;
    }
    ;
    //   private onError (err)  {
    //     this.disconnect(err.message);
    //   };
    isMsgComplete() {
        if (this.buffer.length < 4)
            return false;
        const expectedlen = this.handshakeDone
            ? this.buffer.readUInt32BE(0) + 4
            : this.buffer.readUInt8(0) + 49; // length of pstr + 49
        return this.buffer.length >= expectedlen;
    }
    ;
    handleMsg() {
        const msg = MessageFactory.parseMessage(this.buffer);
        this.buffer = this.buffer.slice(4 + this.buffer.readUInt32BE(0));
        switch (msg.id) {
            case msgId.CHOKE:
                this.state.peerChoking = true;
                console.log(this.id + " Choked us");
                const interested = MessageFactory.getInterestedMsg();
                this.socket.write(interested);
                break;
            case msgId.UNCHOKE:
                this.state.peerChoking = false;
                console.log("Peer " + this.id + "unchoked us");
                this.updateDownloadRate();
                // this.requestPiece();
                break;
            case msgId.INTERESTED:
                console.log(`Peer - ${this.id} is interested`);
                this.state.peerInterested = true;
                this.socket.write(MessageFactory.getUnChokeMsg());
                break;
            case msgId.UNINTERESTED:
                this.state.peerInterested = false;
                console.log(`Peer - ${this.id} is not interested`);
                break;
                //close the socket
                //   case msgId.HAVE:
                //     const pieceIndex = msg.payload.readUInt32BE(0);
                //     this.bitField.set(pieceIndex);
                //     this.torrent.pieces[pieceIndex].count += 1;
                //     break;
                //   case msgId.BITFIELD:
                //     this.handleBitfield(msg);
                //     break;
                //   case msgId.REQUEST:
                //     this.uploadQueue.push(msg.payload);
                //     if (!this.uploading) {
                //       this.uploading = true;
                //       this.handleUploadQueue();
                //     }
                //     break;
                //   case msgId.PIECE:
                //     const { index, begin, block } = msg.payload;
                //     const piece = this.torrent.pieces[index];
                //     if (piece.state !== Piece.states.COMPLETE) {
                //       const pieceComplete = piece.saveBlock(begin, block);
                //       if (pieceComplete) {
                //         this.downstats.numbytes += piece.length;
                //         this.torrent.downloaded += piece.length;
                //         this.updateDownloadRate();
                //         if (this.torrent.mode === "endgame") {
                //           delete this.torrent.missingPieces[index];
                //         }
                //         for (const p of this.torrent.peers) {
                //           if (!p.bitField.test(index)) {
                //             p.send(messages.getHaveMsg(index));
                //           }
                //         }
                //         this.requestPiece();
                //         this.torrent.updateState();
                //       }
                //     }
                //     break;
                //   case msgId.CANCEL:
                //     //cancel the seeding of the piece
                //     const { i, b, l } = msg.payload;
                //     this.uploadQueue = this.uploadQueue.filter(
                //       (p) => !(p.index === i && p.begin === b && p.length === l)
                //     );
                break;
            case msgId.PORT:
                break;
            case msgId.KEEPALIVE:
                //keep alive in socket
                break;
            default:
                break;
        }
    }
    ;
    updateDownloadRate() {
        // length in bytes, t in s, rate in bps
        const history = this.statistic.downloadStatistic.history;
        history.push({
            time: new Date().getTime(),
            numbytes: this.statistic.downloadStatistic.numbytes,
        });
    }
    ;
}
