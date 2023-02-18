import { ActionsType } from "./requestActions";

export default interface connectRespoonse {
    
    action: ActionsType,
    transactionId: number,
    connectionId: number

}