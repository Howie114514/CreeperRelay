const { Connection } = require("bedrock-protocol");
const { Vector3, vec3from, Vector2, vec2from } = require("./math");
const { writeFileSync } = require("fs");
const { BedrockChunk } = require("prismarine-chunk")

module.exports.world = {
    /**
     * @type {Record<Number,{chunks:Record<Vector2,BedrockChunk>}>}
     */
    dimensions: {
    },
    /**@type {Connection} */
    connection: undefined,
    logger: console,
    /**
     * @param {Connection} c 
     */
    setConnection(c) {
        this.connection = c;
        /**
         * @todo 区块解析器
         */
        this.connection.on("clientbound", ({ name, params }) => {
            /*
            if (name == "level_chunk") {
                if (!this.dimensions[params.dimension]) {
                    this.dimensions[params.dimension] = { chunks: {} }
                }
                let cpos = new Vector2(params.x, params.z)
                if (!this.dimensions[params.dimension].chunks[cpos]) {
                    this.dimensions[params.dimension].chunks[cpos] = new BedrockChunk({ x: params.x, z: params.z })
                }
@type {BedrockChunk} 
                let chunk = this.dimensions[params.dimension].chunks[cpos];
                chunk.networkDecodeNoCache(params.payload, params.sub_chunk_count).catch((e) => {
                    this.logger.error(e)
                });
            }
            if (name == "subchunk") {
                if (!this.dimensions[params.dimension]) {
                    this.dimensions[params.dimension] = { chunks: {} }
                }
                if (!this.dimensions[params.dimension].chunks[cpos]) {
                    this.dimensions[params.dimension].chunks[cpos] = new BedrockChunk({ x: params.x, z: params.z })
                }
                let chunk = this.dimensions[params.dimension].chunks[cpos];

            }*/
        });
    },
    /**
     * 设置天气
     * 已知问题： "rain"值不起作用
     * 
     * @example
     * ```javascript
     * world.setWeather("thunder")
     * ```
     * 
     * @param {"rain"|"thunder"|"clear"} type
     * @param {Vector3} pos 
     */
    setWeather(type, pos) {
        if (!this.connection) return;
        switch (type) {
            case "clear":
                this.connection.queue("level_event", {
                    event: "stop_rain",
                    position: pos,
                    data: 0
                });
                this.connection.queue("level_event", {
                    event: "stop_thunder",
                    position: pos,
                    data: 0
                });
                break;
            case "rain":
                this.connection.queue("level_event", {
                    event: "start_rain",
                    position: pos,
                    data: 0
                });
                break;
            case "thunder":
                this.connection.queue("level_event", {
                    event: "start_thunder",
                    position: pos,
                    data: 0
                });
                break;
        }
    }
}
