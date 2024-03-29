import * as fs from "fs";



export class File {
  static NONE = 0;
  static PARTIAL = 1;
  static COMPLETE = 2;
  path
  length
  offset
  fd
  busy
  constructor(path, length, offset) {
    this.path = path;
    this.length = length;
    this.offset = offset;
    this.fd = null;
    this.busy = true; // set to busy till we open the file
  }

  open = (errorHandler) => {
    fs.open(this.path, "r+", (err, fd) => {
      if (err) {
        if (err.code === "ENOENT") {
          fs.open(this.path, "w+", (err, fd) => {
            if (err) return errorHandler(err);
            console.log("opened file");
            this.busy = false;
            this.fd = fd;
          });
        } else return errorHandler(err);
      } else {
        this.fd = fd;
        console.log("opened file");
        this.busy = false;
      }
    });
  };

  close = () => {
    if (!this.fd) return;
    if (this.busy) {
      setTimeout(this.close, 50);
    } else {
      fs.close(this.fd, (err) => {
        if (err) console.log(err);
        this.fd = null;
        this.busy = true;
      });
    }
  };

  contains = (pieceStart, pieceLength) => {
    const fileStart = this.offset;
    const fileEnd = fileStart + this.length;
    const pieceEnd = pieceStart + pieceLength;
    if (pieceEnd <= fileEnd && pieceStart >= fileStart) {
      return File.COMPLETE;
    } else if (
      (fileStart >= pieceStart && fileStart <= pieceEnd) ||
      (fileEnd >= pieceStart && fileEnd <= pieceEnd)
    ) {
      return File.PARTIAL;
    } else return File.NONE;
  };

  read = (buffer, offset, cb) => {
    if (this.busy) {
      return setTimeout((data) => this.read(data, offset, cb), 1000);
    }
    this.busy = true;
    const { dataOffset, dataLen, position } = this.getBounds(
      offset,
      buffer.length
    );
    fs.read(this.fd, buffer, dataOffset, dataLen, position, (err) => {
      this.busy = false;
      return cb(err);
    });
  };

  write = (data, offset, cb) => {
    if (this.busy) {
      console.log("file busy with writing data");
      return setTimeout(() => this.write(data, offset, cb), 1000);
    }
    this.busy = true;
    const { dataOffset, dataLen, position } = this.getBounds(
      offset,
      data.length
    );
    fs.write(this.fd, data, dataOffset, dataLen, position, (err) => {
      this.busy = false;
      return cb(err);
    });
  };

  getBounds(dataStart, dataLength) {
    const start = Math.max(this.offset, dataStart);
    const end = Math.min(this.offset + this.length, dataStart + dataLength);
    const temp = dataStart - this.offset;
    return {
      dataLen: end - start,
      position: temp > 0 ? temp : 0,
      dataOffset: temp >= 0 ? 0 : -temp,
    };
  }
}


