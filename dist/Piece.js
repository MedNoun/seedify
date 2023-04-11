import BitSet from "bitset";
import crypto from "crypto";
export class Piece {
    constructor(hash, index, offset, len, length = len, files, count = 0, state = Piece.states.PENDING, numBlocks = Math.ceil(length / Piece.BlockLength), completedBlocks = BitSet.Random(numBlocks), data = Buffer.alloc(len), saved = false) {
        this.hash = hash;
        this.index = index;
        this.offset = offset;
        this.len = len;
        this.length = length;
        this.files = files;
        this.count = count;
        this.state = state;
        this.numBlocks = numBlocks;
        this.completedBlocks = completedBlocks;
        this.data = data;
        this.saved = saved;
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
                        .catch((err) => console.log("the error in get data in piece class :", err));
                }
                else {
                    resolve(this.data.slice(begin, begin + length));
                }
            });
        };
        this.writePiece = () => {
            console.log("this :", this);
            for (const f of this.files) {
                f.write(this.data, this.offset, (err) => {
                    if (err)
                        console.log("the error in write piece : ", err);
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
            if (this.completedBlocks.toString().length === this.numBlocks) {
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
    }
}
Piece.states = {
    ACTIVE: "active",
    PENDING: "pending",
    COMPLETE: "complete",
    INCOMPLETE: "incomplete",
};
Piece.BlockLength = Math.pow(2, 14);
