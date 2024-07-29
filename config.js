const fs = require("fs");
var config = {
  allowOtherIP: false,
  serverHost: "127.0.0.1",
  serverPort: "19132",
  realms: {
    enabled: true,
    name: "",
    motd: ".*",
  },
  language: "en_US",
};
try {
  config = JSON.parse(fs.readFileSync("./relay.json", "utf8"));
} catch (e) {
  fs.writeFileSync("./relay.json", JSON.stringify(config, undefined, 2));
}
module.exports = config;
