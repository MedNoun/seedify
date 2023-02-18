interface Info{
    length: number;
    name: string;
    pieceLength:number;
    pieces: string;
}
export default interface Tracker{
    announce: string;
    announceList: string[][];
    comment: string;
    createdBy: string;
    creationDate: number;
    encoding: string;
    info: Info;
    urlList : string[]   
    website: string;
}