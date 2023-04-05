export class Statistic {
    constructor() {
        this.downloadStatistic = new DownloadStatistic();
        this.uploadStatitic = new UploadStatitic();
    }
}
class DownloadStatistic {
    constructor(history = []) {
        this.history = history;
    }
    get numbytes() {
        return;
    }
    get rate() {
        const currtime = new Date().getTime();
        const t = (currtime - history[0].time) / 1000; //time in sec
        if (t === 0)
            return;
        const n = this.numbytes - this.history[0].numbytes;
        while (currtime - history[0].time > 1000) {
            this.history.shift();
        }
        return n / t;
    }
}
class UploadStatitic {
    constructor(history = []) {
        this.history = history;
    }
    get numbytes() {
        return;
    }
    get rate() {
        const currtime = new Date().getTime();
        const t = (currtime - history[0].time) / 1000; //time in sec
        if (t === 0)
            return;
        const n = this.numbytes - this.history[0].numbytes;
        while (currtime - history[0].time > 1000) {
            this.history.shift();
        }
        return n / t;
    }
}
