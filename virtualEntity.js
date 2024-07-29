const { Vector3, Vector2 } = require("./math")

class VirtualEntity {
    /**
     * @type {BigInt}
     */
    runtime_id;
    /**
     * @type {Vector3}
     */
    position;
    /**
     * @type {Vector2}
     */
    rotation;
    /**
     * @type {string}
     */
    type;

    packetSender;

    /**
     * 
     * @param {string} type 
     * @param {Vector3} pos
     */
    constructor(type, pos, packetSender) {
        this.type = type;
        this.position = pos;
        this.packetSender = packetSender;
    }
    create() {
        this.packetSender("add_entity", {
            runtime_id: this.runtime_id,
            unique_id: [0, this.runtime_id.toString()],
            entity_type: this.type,
            position: this.position,
            velocity: new Vector3(0, 0, 0).toJSON(),
            pitch: 0,
            yaw: 0,
            head_yaw: 0,
            body_yaw: 0,
            attributes: [],
            metadata: [],
            properties: [],
            links: []
        })
    }
    /**
     * 
     * @param {Vector3} pos 
     * @param {Vector2} rotation 
     */
    teleport(pos, rotation) {
        this.position = pos;
        this.rotation = rotation;
        this.packetSender("move_entity", {
            runtime_entity_id: this.runtime_id,
            position: pos.toJSON(),
            flags: 0,
            rotation: rotation.toJSON()
        });
    }
}