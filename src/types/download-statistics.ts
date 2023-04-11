
export class Statistic {

    public downloadStatistic: DownloadStatistic = new DownloadStatistic()
    public uploadStatitic: UploadStatitic = new UploadStatitic()
}

class DownloadStatistic {

    constructor(
        public history: { time: number, numbytes: number }[] = []
    ) {

    }
    get numbytes(): number {
        return
    }
    set numbytes(n : number){

    }
    get rate() {
        const currtime = new Date().getTime();
        const t = (currtime - history[0].time) / 1000; //time in sec
        if (t === 0) return;
        const n = this.numbytes - this.history[0].numbytes;
        while (currtime - history[0].time > 1000) {
            this.history.shift();
        }
        return n / t
    }
}
class UploadStatitic {
    constructor(
        public history: { time: number, numbytes: number }[] = []
    ) {

    }
    get numbytes(): number {
        return
    }
    set numbytes(n : number){

    }
    get rate() {
        const currtime = new Date().getTime();
        const t = (currtime - history[0].time) / 1000; //time in sec
        if (t === 0) return;
        const n = this.numbytes - this.history[0].numbytes;
        while (currtime - history[0].time > 1000) {
            this.history.shift();
        }
        return n / t
    }
}
