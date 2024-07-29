const { sprintf } = require("sprintf-js");
const config = require("./config");

const language = config.language ?? "en_US";
const languageFile = require(`./languages/${language}.json`);

/**
 *
 * @param {keyof import("./languages/en_US.json")} key
 * @param  {...any} params
 * @returns
 */
module.exports.tr = (key, ...params) => {
  return sprintf(languageFile[key] ?? key, ...params);
};
