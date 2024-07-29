const { Connection } = require("bedrock-protocol");
const { Vector3 } = require("./math");

/**
 * @param {Connection} connection
 * @param {Vector3} pos 
 * @param {string} name 
 */
module.exports.spawnParticle = (connection, pos, name) => {
    connection.queue("spawn_particle_effect", {
        dimension: 0,
        entity_id: -1,
        position: pos,
        particle_name: name,
        molang_variables: []
    })
}