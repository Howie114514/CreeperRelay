const fs = require("fs");

/**
 *
 * @param {string} fp
 * @param {Record<string,any>} defaultCfg
 * @returns
 */
module.exports.getConfig = (fp, defaultCfg) => {
  var config = defaultCfg;
  try {
    Object.assign(config, JSON.parse(fs.readFileSync(fp, "utf8")));
  } catch (e) {
    fs.writeFileSync(fp, JSON.stringify(config, undefined, 2));
  }
  return new Proxy(config, {
    set(t, p, nv) {
      t[p] = nv;
      fs.writeFileSync(fp, JSON.stringify(t, undefined, 2));
    },
  });
};
