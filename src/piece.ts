import BitSet from "bitset";
import { BitsetUtils } from "./shared/bitset-met.js";
import * as crypto from "crypto";



export class Piece {
    static states = {
        ACTIVE: "active",
        PENDING: "pending",
        COMPLETE: "complete",
        INCOMPLETE: "incomplete",
    };
    static BlockLength = Math.pow(2, 14);
    hash
    index
    offset
    length
    count
    state
    numBlocks
    completedBlocks
    data
    saved
    files

    constructor(index, offset, len, hash, files) {
        this.hash = hash;
        this.index = index;
        this.offset = offset;
        this.length = len;
        this.count = 0;
        this.state = Piece.states.PENDING;
        this.numBlocks = Math.ceil(this.length / Piece.BlockLength);
        this.completedBlocks = BitSet.Random(this.numBlocks);
        this.data = Buffer.alloc(len);
        this.saved = false;
        this.files = files;
    }

    saveBlock = (begin, block) => {
        if (this.state === Piece.states.COMPLETE) return true;
        block.copy(this.data, begin);
        this.completedBlocks.set(begin / Piece.BlockLength);
        if (this.isComplete()) {
            this.writePiece();
            return true;
        } else return false;
    };

    getData = (begin, length) => {
        return new Promise((resolve, reject) => {
            if (!this.data) {
                this.readPiece()
                    .then(() => {
                        resolve(this.data.slice(begin, begin + length));
                    })
                    .catch((err) => console.log(err));
            } else {
                resolve(this.data.slice(begin, begin + length));
            }
        });
    };

    writePiece = () => {
        console.log(this);
        for (const f of this.files) {
            f.write(this.data, this.offset, (err) => {
                if (err) console.log(err);
                this.data = null;
                this.saved = true;
            });
        }
    };

    readPiece = () => {
        return new Promise((resolve, reject) => {
            let c = 0;
            this.data = Buffer.alloc(this.length);
            for (const f of this.files) {
                f.read(this.data, this.offset, (err) => {
                    reject(err);
                    c += 1;
                    if (c === this.files.length) return resolve;
                });
            }
        });
    };

    isComplete = () => {
        if (BitsetUtils.count(this.completedBlocks) === this.numBlocks) {
            let shasum = crypto.createHash("sha1").update(this.data).digest();
            if (!this.hash.compare(shasum)) {
                this.state = Piece.states.COMPLETE;
                console.log(`piece verified, index : ${this.index}`);
                return true;
            } else {
                this.state = Piece.states.PENDING;
                this.completedBlocks = BitSet.Random(this.numBlocks);
                return false;
            }
        }
        return false;
    };

}

