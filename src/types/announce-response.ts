import { ActionsType } from "./requestActions";

export default interface AnnounceResponse {
    action: ActionsType,
    transactionId: number,
    intervals: number,
    leechers: any,
    seeders: any,
    ipAddresses: any[],
    tcpPort: any
}