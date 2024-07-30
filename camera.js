const { Connection } = require("bedrock-protocol");
const { Vector3, Vector2 } = require("./math");

module.exports.camera = {
  presets: {},
  /**
   * @type {Connection}
   */
  connection: undefined,
  setConnection(connection) {
    this.connection = connection;
    this.connection.on("clientbound", ({ name, params }, dest) => {
      if (name == "camera_presets") {
        params.presets.forEach((p, i) => {
          this.presets[p.name] = p;
          this.presets[p.name].index = i;
        });
      }
    });
  },
  /**
   * @param {Vector3} pos
   * @param {Vector2} rotation
   */
  move(pos, rotation) {
    if (!this.connection) {
      return;
    }
    this.connection.queue("camera_instruction", {
      instruction_set: {
        runtime_id: this.presets["minecraft:free"].index,
        position: pos,
        rotation: rotation,
        ease_data: {
          type: "Linear",
          duration: 0.08,
        },
      },
    });
  },
  clear() {
    if (!this.connection) {
      return;
    }
    this.connection.queue("camera_instruction", {
      clear: true,
    });
  },
};
