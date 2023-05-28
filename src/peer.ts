import { Piece } from './piece.js';
import { createConnection, Socket } from "net"
import { MessageFactory } from "./message-factory.js";
import { Torrent } from "./Torrent";
import { Statistic } from "./types/download-statistics.js";
import { msgId } from "./types/messagesId.enum.js";
import { PeerState } from "./types/peerState.enum.js";
import BitSet from "bitset";


export class Peer {


    constructor(
        public ip: string,
        public port: number,
        public state: PeerState,
        public torrent: Torrent,
        public hscb: (n: any) => any,
        public stream = null,
        public lastReceivedTime = undefined,
        public statistic: Statistic = new Statistic(),
        public socket: Socket = createConnection({ host: ip, port: port }),
        public buffer = Buffer.alloc(0),
        public msgProcessing = false,
        public handshakeDone = false,
        public bitfield = torrent ? BitSet.Random(torrent.numPieces) : null,
        public uploadQueue = [],
        public uploading: boolean = undefined,
        public currPieceIndex = -1,
        public uniqueId = ip + ":" + port,
        public disconnected = false,
        public intervalId = null
    ) {
    }

    get id() {
        return this.ip + " : " + this.port
    }

    public connect() {
        this.socket.on("connect", () => {
            let handshake = MessageFactory.buildHandshakePacket(
                this.torrent.metadata.infoHash,
                this.torrent.clientId
            );
            console.log("I am sending the handshake method to the peer ", this.uniqueId)
            this.socket.write(handshake);
        })
        this.socket.on("error", (err) => this.onError(err));
        this.socket.on("data", (data) => this.onData(data));
        this.socket.on("end", () => this.onEnd());

        //we must add the message keepAlicce every x minute
    }

    public onEnd() {
        console.log(`Peer ${this.uniqueId} received end`);
        this.stream = null;
        if (this.state.amInterested) {
            this.disconnect("reconnect"/*, 5000*/);
        } else {
            this.disconnect("Not interested");
        }
    };

    private onData(data) {
        this.lastReceivedTime = new Date().getTime();
        this.buffer = Buffer.concat([this.buffer, data]);
        if (this.msgProcessing) return;
        this.msgProcessing = true;
        while (this.isMsgComplete()) {
            if (this.handshakeDone) {
                this.handleMsg();
            } else {
                this.handleHandshake();
            }
        }
        this.msgProcessing = false;
    };

    public handleHandshake() {
        const hs = MessageFactory.parseHandshake(this.buffer);
        if (hs.pstr === "BitTorrent protocol") {
            this.handshakeDone = true;
            console.log(`Handshake done for Peer  ${this.id}`);
        }
        if (this.hscb) {
            this.hscb(hs.infoHash);
        }
        this.buffer = this.buffer.slice(this.buffer.readUInt8(0) + 49);
    };

    private onError(err) {
        this.disconnect(err.message);
    };

    public disconnect(msg) {
        console.log(`peer disconnected ${this.uniqueId} with message ${msg}`);
        this.disconnected = true;

        for (let i = 0; i < this.torrent.pieces.length; i++) {
            this.torrent.pieces[i].count -= this.bitfield.get(i);
        }
        this.torrent.peers = this.torrent.peers.filter(
            (p) => p.uniqueId !== this.uniqueId
        );
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }
    };
    private isMsgComplete() {
        if (this.buffer.length < 4) return false;
        const expectedlen = this.handshakeDone
            ? this.buffer.readUInt32BE(0) + 4
            : this.buffer.readUInt8(0) + 49; // length of pstr + 49
        return this.buffer.length >= expectedlen;
    };

    private handleMsg() {
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
                console.log("I am requesting piece !")
                this.requestPiece();
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
            // close the socket

            case msgId.HAVE:
                const pieceIndex = msg.payload.readUInt32BE(0);
                this.bitfield.set(pieceIndex);
                this.torrent.pieces[pieceIndex].count += 1;
                break;

            case msgId.BITFIELD:
                this.handleBitfield(msg);
                break;

            case msgId.REQUEST:
                this.uploadQueue.push(msg.payload);
                if (!this.uploading) {
                    this.uploading = true;
                    this.handleUploadQueue();
                }
                break;

            case msgId.PIECE:
                const { index, begin, block } = msg.payload;
                const piece = this.torrent.pieces[index];
                if (piece.state !== Piece.states.COMPLETE) {
                    const pieceComplete = piece.saveBlock(begin, block);
                    if (pieceComplete) {
                        this.statistic.downloadStatistic.numbytes += piece.length;
                        this.torrent.downloaded += piece.length;
                        this.updateDownloadRate();
                        if (this.torrent.mode === "endgame") {
                            delete this.torrent.missingPieces[index];
                        }
                        for (const p of this.torrent.peers) {
                            if (!this.test(p.bitfield, index)) {
                                p.send(MessageFactory.getHaveMsg(index));
                            }
                        }
                        this.requestPiece();
                        this.torrent.updateState();
                    }
                }
                break;

            case msgId.CANCEL:
                //cancel the seeding of the piece
                const { i, b, l } = msg.payload;
                this.uploadQueue = this.uploadQueue.filter(
                    (p) => !(p.index === i && p.begin === b && p.length === l)
                );
                break;

            case msgId.PORT:
                break;

            case msgId.KEEPALIVE:
                //keep alive in socket
                break;

            default:
                break;
        }
    };
    send = (msg) => {
        if (this.socket) {
            this.socket.write(msg);
        }
    };
    updateDownloadRate() {
        // length in bytes, t in s, rate in bps
        const history = this.statistic.downloadStatistic.history;
        history.push({
            time: new Date().getTime(),
            numbytes: this.statistic.downloadStatistic.numbytes,
        });
    };

    requestPiece() {
        // if (
        //   this.torrent.downLimitFactor !== 0 &&
        //   Math.random() < this.torrent.downLimitFactor
        // ) {
        //   setTimeout(this.requestPiece, 100);
        // }
        let pieceIndex = -1;
        if (this.torrent.mode === "endgame") {
            let missing = [];
            for (const m in this.torrent.missingPieces) {
                const ind = parseInt(m, 10);
                if (this.test(this.bitfield, ind)) missing.push(ind);
            }
            if (missing.length > 0) {
                const r = Math.floor(Math.random() * missing.length);
                pieceIndex = missing[r];
            }
        } else {
            pieceIndex = this.getRarestPieceIndex();
        }
        // console.log("the piece index is :  ******************* ", pieceIndex)
        if (pieceIndex !== -1) {
            const p = this.torrent.pieces[pieceIndex];
            p.state = Piece.states.ACTIVE;
            for (let i = 0; i < p.numBlocks; i++) {
                if (this.torrent.mode === "endgame" && this.test(p.completedBlocks, i)) {
                    continue;
                }
                let len = Piece.BlockLength;
                //if last piece, modify length
                if (i === p.numBlocks - 1 && p.length % Piece.BlockLength !== 0) {
                    len = p.length % Piece.BlockLength;
                }
                const requestPacket = {
                    index: pieceIndex,
                    begin: Piece.BlockLength * i,
                    length: len,
                };
                this.send(MessageFactory.getRequestMsg(requestPacket));
            }
            this.currPieceIndex = pieceIndex;
        } else {
            this.send(MessageFactory.getNotInterestedMsg()/*, () =>{
            this.disconnect("peer has no pieces useful to us")
          */)
        }
    }
    getRarestPieceIndex() {
        let rarity = 100000; // large number
        let pieceIndex = -1;
        let ps = this.torrent.pieces;
        for (let i = 0; i < ps.length; i++) {
            if (
                this.test(this.bitfield, i) &&
                ps[i].count < rarity &&
                ps[i].state === Piece.states.PENDING
                // ps[i].state !== Piece.states.COMPLETE
            ) {
                rarity = ps[i].count;
                pieceIndex = i;
            }
        }
        return pieceIndex;
    };
    public handleBitfield(m) {
        this.bitfield = this.fromBufferToBitset(m.payload.slice(0, Math.ceil(this.torrent.pieces.length / 8))
        );

        for (let i = 0; i < this.torrent.pieces.length; i++) {
            this.torrent.pieces[i].count += this.bitfield.get(i);
        }

        if (this.state.amInterested === false) {
            this.state.amInterested = true;
            const interested = MessageFactory.getInterestedMsg();
            console.log(this.uniqueId, " : Sending Interested message : ");
            this.socket.write(interested);
        }
    };

    public handleUploadQueue() {
        if (this.uploadQueue.length > 0) {
            const { index, begin, length } = this.uploadQueue.shift();
            if (this.torrent.pieces[index].state === Piece.states.COMPLETE) {
                this.torrent.pieces[index].getData(begin, length).then((data: any) => {
                    this.socket.write(data);
                    this.torrent.uploaded += length;
                    this.statistic.uploadStatitic.numbytes += length;
                    this.statistic.uploadStatitic.history.push({
                        time: new Date().getTime(),
                        numbytes: this.statistic.uploadStatitic.numbytes,
                    }) // thid update the uploaded history
                    this.handleUploadQueue();
                });
            }
        } else this.uploading = false;
    };


    test(bitset: BitSet, index: number) {
        return bitset.get(index) === 1;
    }

    public fromBufferToBitset(buffer) {
        const b = BitSet.Random(buffer.length * 8)


        for (let i = 0; i < buffer.length; i++) {
            for (let j = 0; j < 8; j++) {
                const byte = buffer[i];
                const bitIndex = i * 8 + j;
                if ((byte & (1 << (7 - j))) !== 0) {
                    b.set(bitIndex);
                } else {
                    b.clear(bitIndex);
                }
            }
        }
        return b
    }
};