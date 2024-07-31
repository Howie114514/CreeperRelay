const { Connection } = require("bedrock-protocol");

module.exports = {
  /**@type {Connection|undefined} */
  connection: undefined,
  setConnection(c) {
    this.connection = c;
    this.connection.on("clientbound", ({ name, params }) => {
      if (name == "resource_packs_info" || name == "resource_packs_stack") {
        console.log(params);
      }
    });
  },
};
