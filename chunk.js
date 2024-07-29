const mt19937 = require("@stdlib/random-base-mt19937");
var int32ToUint32 = require('@stdlib/number-int32-base-to-uint32');

class Chunk {
    /**@type {Number} */
    x
    /**@type {Number} */
    z
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
    /**
     * 是否为史莱姆区块
     * @returns {Boolean}
     */
    isSlimeChunk() {
        let seed = int32ToUint32((this.x * 0x1f1f1f1f) ^ this.z);
        let n = mt19937.factory({ seed: seed == 0 ? 1 : seed })();
        return !(n % 10);
    }
}

module.exports.Chunk = Chunk;
module.exports.ChunkfromWorldPos = (x, z) => {
    return new Chunk(x >> 4, z >> 4)
}