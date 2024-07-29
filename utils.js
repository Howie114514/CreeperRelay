const fs = require("fs")

/**
 * 
 * @param {string} str 
 * @param {*} index 
 * @param {*} char 
 * @returns 
 */
module.exports.replaceCharAt = (str, index, char) => {
    let arr = str.split("");
    arr[index] = char;
    return arr.join("");
}

module.exports.strFromUnicode = (data) => {
    try {
        return JSON.parse(`"${data.replace(/\"/, "\\\"")}"`).toString();
    } catch (e) {
        return data
    }
}


module.exports.floorMod = (n1, n2) => {
    return ((n1 % n2) + n2) % n2;
}

module.exports.dir = (d, ext) => {
    let res = "";
    try {
        fs.readdirSync(d).forEach((v) => {
            if (v.endsWith(ext)) {
                res += v + "\n";
            }
        })
    } catch (e) { }
    return res;
}

module.exports.pwait = (t) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, t);
    })
}