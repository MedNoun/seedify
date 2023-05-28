import BitSet from "bitset";
import { BitsetUtils } from "./shared/bitset-met.js";
import * as crypto from "crypto";
export class Piece {
    constructor(index, offset, len, hash, files) {
        this.saveBlock = (begin, block) => {
            if (this.state === Piece.states.COMPLETE)
                return true;
            block.copy(this.data, begin);
            this.completedBlocks.set(begin / Piece.BlockLength);
            if (this.isComplete()) {
                this.writePiece();
                return true;
            }
            else
                return false;
        };
        this.getData = (begin, length) => {
            return new Promise((resolve, reject) => {
                if (!this.data) {
                    this.readPiece()
                        .then(() => {
                        resolve(this.data.slice(begin, begin + length));
                    })
                        .catch((err) => console.log(err));
                }
                else {
                    resolve(this.data.slice(begin, begin + length));
                }
            });
        };
        this.writePiece = () => {
            console.log(this);
            for (const f of this.files) {
                f.write(this.data, this.offset, (err) => {
                    if (err)
                        console.log(err);
                    this.data = null;
                    this.saved = true;
                });
            }
        };
        this.readPiece = () => {
            return new Promise((resolve, reject) => {
                let c = 0;
                this.data = Buffer.alloc(this.length);
                for (const f of this.files) {
                    f.read(this.data, this.offset, (err) => {
                        reject(err);
                        c += 1;
                        if (c === this.files.length)
                            return resolve;
                    });
                }
            });
        };
        this.isComplete = () => {
            if (BitsetUtils.count(this.completedBlocks) === this.numBlocks) {
                let shasum = crypto.createHash("sha1").update(this.data).digest();
                if (!this.hash.compare(shasum)) {
                    this.state = Piece.states.COMPLETE;
                    console.log(`piece verified, index : ${this.index}`);
                    return true;
                }
                else {
                    this.state = Piece.states.PENDING;
                    this.completedBlocks = BitSet.Random(this.numBlocks);
                    return false;
                }
            }
            return false;
        };
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
}
Piece.states = {
    ACTIVE: "active",
    PENDING: "pending",
    COMPLETE: "complete",
    INCOMPLETE: "incomplete",
};
Piece.BlockLength = Math.pow(2, 14);
