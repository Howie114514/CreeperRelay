const { Connection } = require("bedrock-protocol");
const { Vector3, Vector2 } = require("./math");

module.exports.camera = {
    /**
     * @type {Connection}
     */
    connection: undefined,
    /**
     * @param {Vector3} pos 
     * @param {Vector2} rotation 
     */
    move(pos, rotation) {
        if (!this.connection) { return }
        this.connection.queue("camera_instruction", {
            instruction_set: {
                runtime_id: 0,
                position: pos,
                rotation: rotation,
                ease_data: {
                    type: "Linear",
                    duration: 0.08
                }
            }
        });
    },
    clear() {
        if (!this.connection) { return }
        this.connection.queue("camera_instruction", {
            clear: true
        });
    }
}