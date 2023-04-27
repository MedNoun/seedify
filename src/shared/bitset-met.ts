import BitSet from "bitset";

export class BitsetUtils {

    public static count(bitset : BitSet){
        let x = 0 ;
        for(let i of bitset){
            x++
        }
        return x 
    }
}