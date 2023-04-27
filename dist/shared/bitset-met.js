export class BitsetUtils {
    static count(bitset) {
        let x = 0;
        for (let i of bitset) {
            x++;
        }
        return x;
    }
}
