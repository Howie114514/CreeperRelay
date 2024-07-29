/**
 * @member {number} x
 * @member {number} y
 * @member {number} z
 */
module.exports.Vector3 = class Vector3 {
    x
    y
    z
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }
    /**
     * 
     * @param {Vector3|number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {Vector3}
     */
    add(x, y, z) {
        if (typeof x == "object") {
            return new Vector3(x.x + this.x, x.y + this.y, x.z + this.z)
        } else {
            return new Vector3(x | 0 + this.x, y | 0 + this.y, z | 0 + this.z)
        }
    }

    /**
     * 
     * @param {Vector3|number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {number}
     */
    distanceTo(x, y, z) {
        let tp;
        if (typeof x == "object") {
            tp = x;
        } else {
            tp = new Vector3(x, y, z);
        }
        return Math.sqrt(Math.pow(tp.x, 2) + Math.pow(tp.z, 2) + Math.pow(tp.y, 2));
    }
    /**
     * 
     * @returns {{x:number,y:number,z:number}}
     */
    toJSON() {
        return { x: this.x, y: this.y, z: this.z }
    }
    /**
     * 
     * @returns {string}
     */
    toString() {
        return `Vector3 {${this.x},${this.y},${this.z}}`;
    }
    /**
     * @returns {Vector3} Location in Nether
     */
    toNetherPos() {
        return new Vector3(this.x / 8, this.y / 8, this.z / 8);
    }
    /**
     * @returns {Vector3} Location in Overworld
     */
    toOverworldPos() {
        return new Vector3(this.x * 8, this.y * 8, this.z * 8);
    }
    toBlockCoordinates() {
        return new Vector3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    }
}
module.exports.vec3from = (a) => {
    return new this.Vector3(a.x, a.y, a.z);
}

module.exports.Vector2 = class Vector2 {
    x
    z
    constructor(x, z) {
        this.x = x; this.z = z;
    }
    /**
     * 
     * @param {Vector3|number} x 
     * @param {number} z 
     * @returns {Vector3}
     */
    add(x, z) {
        if (typeof x == "object") {
            return new Vector2(x.x + this.x, x.z + this.z)
        } else {
            return new Vector2(x | 0 + this.x, z | 0 + this.z)
        }
    }

    /**
     * 
     * @param {Vector3|number} x 
     * @param {number} y 
     * @returns {number}
     */
    distanceTo(x, z) {
        let tp;
        if (typeof x == "object") {
            tp = x;
        } else {
            tp = new Vector2(x, z);
        }
        return Math.sqrt(Math.pow(tp.x, 2) + Math.pow(tp.z, 2));
    }
    /**
     * 
     * @returns {{x:number,y:number}}
     */
    toJSON() {
        return { x: this.x, y: this.z }
    }
    /**
     * 
     * @returns {string}
     */
    toString() {
        return `Vector2 {${this.x},${this.z}}`;
    }
}

module.exports.vec2from = (a) => {
    return new this.Vector2(a.x, a.z);
}
