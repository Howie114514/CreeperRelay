/**
 * Creeper Relay
 * @author HowieNB
 */

"use strict";

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const isDevEnv = true;
const VERSION = "1.0.0";

const readline = require("readline");
const bedrock = require("bedrock-protocol");
const log4js = require("log4js");
const realms = require("prismarine-realms");
const fs = require("fs");
const { Authflow } = require("prismarine-auth");
const { spawnParticle } = require("./particle");
const { CommandManager, Command, argumentTypes } = require("./command");
const { Vector3, vec3from, Vector2, vec2from } = require("./math");
const { Chunk, ChunkfromWorldPos } = require("./chunk");
const { EventEmitter } = require("events");
const { randomUUID } = require("crypto");
const { camera } = require("./camera");
const { world } = require("./world");
const moment = require("moment");
var colors = require("colors");
const { strFromUnicode, dir, pwait } = require("./utils");
const { NBSPlayer } = require("./music");
const MinecraftData = require("minecraft-data");
const { PluginManager } = require("./pluginManager");
const path = require("path");
const config = require("./config");
const { tr } = require("./lang");

log4js.configure({
  appenders: {
    console: {
      type: "console",
    },
    file: {
      type: "file",
      filename: `logs/creeper_relay_${moment().format(
        "YYYY-MM-DD-HH-mm-ss"
      )}.log`,
    },
  },
  categories: {
    default: { appenders: ["console", "file"], level: "debug" },
  },
});
const logger = log4js.getLogger("relay");

const commandMgr = new CommandManager(log4js.getLogger("command"));
world.logger = log4js.getLogger("world");

/**
 * @type {import("prismarine-realms").Realm}
 */
let realm;
/**
 * @type {bedrock.Relay}
 */
var relay;
/**
 * @type {bedrock.Player}
 */
var connection;

function shutdown() {
  logger.info(tr("server.closing"));
  clientInstance.connection?.disconnect(tr("server.closed.message"));
  logger.info(tr("server.closed"));
}

process.on("SIGINT", (s) => {
  shutdown();
  process.exit(0);
});
process.on("beforeExit", (s) => {
  shutdown();
  process.exit(0);
});

var gameData = {
  entity_id: undefined,
  runtime_entity_id: undefined,
  player_gamemode: undefined,
  player_position: undefined,
  rotation: undefined,
  seed: undefined,
  biome_type: undefined,
  biome_name: undefined,
  dimension: undefined,
  generator: undefined,
  world_gamemode: undefined,
  difficulty: undefined,
  spawn_position: undefined,
  achievements_disabled: undefined,
  editor_world_type: undefined,
  created_in_editor: undefined,
  exported_from_editor: undefined,
  day_cycle_stop_time: undefined,
  edu_offer: undefined,
  edu_features_enabled: undefined,
  edu_product_uuid: undefined,
  rain_level: undefined,
  lightning_level: undefined,
  has_confirmed_platform_locked_content: undefined,
  is_multiplayer: undefined,
  broadcast_to_lan: undefined,
  xbox_live_broadcast_mode: undefined,
  platform_broadcast_mode: undefined,
  enable_commands: undefined,
  is_texturepacks_required: undefined,
  gamerules: undefined,
  experiments: undefined,
  experiments_previously_used: undefined,
  bonus_chest: undefined,
  map_enabled: undefined,
  permission_level: undefined,
  server_chunk_tick_range: undefined,
  has_locked_behavior_pack: undefined,
  has_locked_resource_pack: undefined,
  is_from_locked_world_template: undefined,
  msa_gamertags_only: undefined,
  is_from_world_template: undefined,
  is_world_template_option_locked: undefined,
  only_spawn_v1_villagers: undefined,
  persona_disabled: undefined,
  custom_skins_disabled: undefined,
  emote_chat_muted: undefined,
  game_version: undefined,
  limited_world_width: undefined,
  limited_world_length: undefined,
  is_new_nether: undefined,
  edu_resource_uri: undefined,
  experimental_gameplay_override: undefined,
  chat_restriction_level: undefined,
  disable_player_interactions: undefined,
  level_id: undefined,
  world_name: undefined,
  premium_world_template_id: undefined,
  is_trial: undefined,
  movement_authority: undefined,
  rewind_history_size: undefined,
  server_authoritative_block_breaking: undefined,
  current_tick: undefined,
  enchantment_seed: undefined,
  block_properties: undefined,
  itemstates: undefined,
  multiplayer_correlation_id: undefined,
  server_authoritative_inventory: undefined,
  engine: undefined,
  property_data: undefined,
  block_pallette_checksum: undefined,
  world_template_id: undefined,
  client_side_generation: undefined,
  block_network_ids_are_hashes: undefined,
  server_controlled_sound: undefined,

  /**
   * 附加数据
   */
  selected_item: { network_id: 0 },
  selected_slot: 0,
  is_sneaking: false,
  is_sprinting: false,
};
const hardcoded_dimensions = ["overworld", "nether", "end"];

let clientInstance = {
  tick: 0,
  players: {},
  entityPlayers: {},
  __playerByName_mappings: {},
  /**@type {bedrock.Player|undefined} */
  connection: undefined,
  /**
   * @type {EventEmitter<{"spawn","disconnect","tick"}>}
   */
  events: new EventEmitter(),
  playerByName(n) {
    return this.entityPlayers[this.__playerByName_mappings[n]];
  },
  getGameData() {
    return gameData;
  },
  sendToast(title, text) {
    clientInstance.connection.queue("toast_request", {
      title: title,
      message: text,
    });
  },
  showMessage(...text) {
    if (!clientInstance.connection) return;
    clientInstance.connection.queue("text", {
      type: "raw",
      needs_translation: false,
      xuid: "",
      platform_chat_id: "",
      filtered_message: text.join(" "),
      message: text.join(" "),
    });
  },
  sendMessage(...text) {
    clientInstance.connection.upstream.queue("text", {
      type: "chat",
      needs_translation: false,
      source_name: clientInstance.connection.profile.name,
      xuid: "",
      filtered_message: "",
      parameters: undefined,
      xuid: clientInstance.connection.profile.xuid,
      platform_chat_id: "",
      message: text.join(" "),
    });
  },
  runCommand(cmd) {
    clientInstance.connection.queue("command_request", {
      command: cmd,
      origin: {
        type: "player",
        uuid: randomUUID(),
        request_id: "",
        player_entity_id: undefined,
      },
      internal: false,
      version: 76,
    });
  },
  /**
   *
   * @param {Vector3} pos
   * @param {Vector2} rotation
   */
  tp(pos, pitch, yaw, head_yaw) {
    clientInstance.connection.queue("move_player", {
      runtime_id: Number(gameData.runtime_entity_id),
      position: pos,
      pitch: pitch,
      yaw: yaw,
      head_yaw: head_yaw,
      mode: "normal",
      on_ground: true,
      ridden_runtime_id: 0,
      tick: 0n,
    });
  },
  disconnect() {
    clientInstance.connection.disconnect();
  },
  /**
   *
   * @param {"normal"|"inventory_mismatch"|"item_use"|"item_use_on_entity"|"item_release"} mode
   */
  interact(mode) {
    try {
      clientInstance.connection.queue("inventory_transaction", {
        transaction: {
          legacy: {
            legacy_request_id: 0,
            legacy_transactions: [],
          },
          transaction_type: mode,
          actions: [],
          transaction_data: {
            action_type: "click_air",
            block_position: { x: 0, y: 0, z: 0 },
            face: 0,
            hotbar_slot: gameData.selected_slot,
            held_item: gameData.selected_item,
            player_pos: gameData.player_position,
            click_pos: { x: 0, y: 0, z: 0 },
          },
        },
      });
    } catch (e) {
      logger.error("ERR!", e);
    }
  },
  /**
   *
   * @param {Vector3} pos
   */
  hitBlock(pos) {
    try {
      this.connection.upstream.queue("player_action", {
        runtime_entity_id: gameData.runtime_entity_id,
        action: "start_break",
        position: pos,
        result_position: pos,
        face: 1,
      });
      this.swing();
      this.connection.upstream.queue("player_action", {
        runtime_entity_id: gameData.runtime_entity_id,
        action: "abort_break",
        position: pos,
        result_position: pos,
        face: 1,
      });
    } catch (e) {}
  },
  swing() {
    this.connection.queue("entity_event", {
      runtime_entity_id: gameData.runtime_entity_id,
      event_id: "arm_swing",
      data: 0,
    });
  },
  /**
   *
   * @param {Vector3Like} pos
   */
  clickBlock(pos) {
    clientInstance.connection.queue("inventory_transaction", {
      transaction: {
        legacy: {
          legacy_request_id: 0,
          legacy_transactions: [],
        },
        transaction_type: "item_use",
        actions: [],
        transaction_data: {
          action_type: "click_block",
          block_position: pos,
          face: 1,
          hotbar_slot: gameData.selected_slot,
          held_item: gameData.selected_item,
          player_pos: gameData.player_position,
          click_pos: { x: Math.random(), y: 1, z: Math.random() },
          block_runtime_id: 166024317,
        },
      },
    });
  },
};

const CRContext = {
  client: clientInstance,
  commandManager: commandMgr,
  getLogger: log4js.getLogger,
};
const pluginManager = new PluginManager(
  "./plugins/",
  log4js.getLogger("Plugin"),
  CRContext
);

//#region Commands
commandMgr.registerCommand(
  new Command(
    "seed",
    tr("command.seed.desc"),
    () => {
      commandMgr.sendMessage(
        tr("command.seed.result", gameData.seed.toString())
      );
    },
    []
  )
);

let autofish_on = false;
let hook_id = 0n;
let autofish_func_gethook = ({ name, params }) => {
  if (name == "add_entity") {
    if (params.entity_type == "minecraft:fishing_hook") {
      hook_id = params.runtime_id;
      clientInstance.connection.off("clientbound", autofish_func_gethook);
    }
  }
};
let autofish_func_packet = ({ name, params }) => {
  if (
    name == "entity_event" &&
    params.event_id == "fish_hook_hook" &&
    params.runtime_entity_id == hook_id
  ) {
    clientInstance.interact("item_use");
    clientInstance.connection.on("clientbound", autofish_func_gethook);
    clientInstance.interact("item_use");
  }
};
commandMgr.registerCommand(
  new Command(
    "af",
    tr("command.af.desc"),
    (a) => {
      if (a == "on" && !autofish_on) {
        autofish_on = true;
        clientInstance.connection.on("clientbound", autofish_func_gethook);
        clientInstance.connection.on("clientbound", autofish_func_packet);
        clientInstance.interact("item_use");
      } else {
        autofish_on = false;
        clientInstance.connection.off("clientbound", autofish_func_gethook);
        clientInstance.connection.off("clientbound", autofish_func_packet);
      }
    },
    [argumentTypes.enum(["on", "off"])]
  )
);

commandMgr.registerCommand(
  new Command(
    "pos",
    "显示/隐藏坐标",
    (arg0) => {
      if (arg0 == "show") {
        gameData.gamerules.forEach((gr, i) => {
          if (gr.name.toLowerCase() == "showcoordinates") {
            gameData.gamerules[i]["value"] = true;
          }
        });
        commandMgr.sendMessage("已显示坐标");
      } else {
        gameData.gamerules.forEach((gr, i) => {
          if (gr.name.toLowerCase() == "showcoordinates") {
            gameData.gamerules[i]["value"] = false;
          }
        });
        commandMgr.sendMessage("已隐藏坐标");
      }
      clientInstance.connection.queue("game_rules_changed", {
        rules: gameData.gamerules,
      });
    },
    [argumentTypes.enum(["show", "hide"])]
  )
);

function drawSlimeChunk(x, z) {
  let _x = x * 16,
    _z = z * 16;
  let p1 = { x: _x + 0.01, y: 0, z: _z + 8 },
    p2 = { x: _x + 15.99, y: 0.0, z: _z + 8.0 },
    p3 = { x: _x + 8.0, y: 0.0, z: _z + 0.01 },
    p4 = { x: _x + 8.0, y: 0.0, z: _z + 15.99 },
    top = { x: _x + 8.0, y: 128.0, z: _z + 8.0 };
  let side1 = "ll:slime_side1";
  let side2 = "ll:slime_side2";
  let topn = "ll:slime_top";
  spawnParticle(clientInstance.connection, p1, side1);
  spawnParticle(clientInstance.connection, p2, side1);
  spawnParticle(clientInstance.connection, p3, side2);
  spawnParticle(clientInstance.connection, p4, side2);
  spawnParticle(clientInstance.connection, top, topn);
}
var scInterval = undefined;
/**
 * @type {Chunk[]}
 */
var slimeChunkList = [];
var scInterval2 = undefined;

commandMgr.registerCommand(
  new Command(
    "sc",
    "显示史莱姆区块",
    (arg0) => {
      let show = arg0 == "show";
      if (show) {
        if (!scInterval2) {
          scInterval2 = setInterval(() => {
            slimeChunkList.forEach((c) => {
              drawSlimeChunk(c.x, c.z);
            });
          }, 5000);
        }
        if (!scInterval)
          scInterval = setInterval(() => {
            slimeChunkList = [];
            let range = 7;
            let currentChunk = ChunkfromWorldPos(
              gameData.player_position.x,
              gameData.player_position.z
            );
            for (let x = -range; x < range; x++) {
              for (let z = -range; z < range; z++) {
                let c = new Chunk(currentChunk.x + x, currentChunk.z + z);
                if (c.isSlimeChunk()) {
                  slimeChunkList.push(c);
                }
              }
            }
          });
        commandMgr.sendMessage("史莱姆区块：显示");
      } else {
        if (scInterval) {
          clearInterval(scInterval);
          clearInterval(scInterval2);
          scInterval = undefined;
          scInterval2 = undefined;
          ``;
        }
        commandMgr.sendMessage("史莱姆区块：隐藏");
      }
    },
    [argumentTypes.enum(["show", "hide"])]
  )
);

commandMgr.registerCommand(
  new Command(
    "plugin",
    "未实装的插件系统",
    () => {
      commandMgr.emit("error", "尚未实装该命令。");
    },
    [argumentTypes.enum(["load", "reload", "debug"])]
  )
);

var freeCam = false;
var cameraPos = { x: 0, y: 0, z: 0 };
var cameraRot = { x: 0, z: 0 };
const cameraSpeedBase = 10;
var cameraSpeed = 1;
var cameraSpeed_ = cameraSpeedBase + cameraSpeed;
commandMgr.registerCommand(
  new Command(
    "camera",
    "自由视角",
    (a, speed) => {
      switch (a) {
        case "free":
          freeCam = true;
          cameraPos = vec3from(gameData.player_position).add(0, 1, 0);
          cameraRot = gameData.rotation;
          camera.move(cameraPos, cameraRot);
          commandMgr.sendMessage("自由视角已开启");
          break;
        case "clear":
          freeCam = false;
          camera.clear();
          commandMgr.sendMessage("自由视角已关闭");
          break;
        case "speed":
          if (!speed) {
            commandMgr.emit("error", "请提供速度参数");
            return;
          }
          cameraSpeed = speed;
          cameraSpeed_ = cameraSpeed + cameraSpeedBase;
          commandMgr.sendMessage("相机速度已设置为", cameraSpeed);
          break;
      }
    },
    [
      argumentTypes.enum(["free", "clear", "speed"]),
      argumentTypes.optional.number("speed"),
    ]
  )
);

commandMgr.registerCommand(
  new Command(
    "cweather",
    "客户端修改天气",
    (a0) => {
      world.setWeather(a0, gameData.player_position);
      commandMgr.sendMessage("天气已强制更改至", a0);
    },
    [argumentTypes.enum(["clear", "rain", "thunder"])]
  )
);

var nvloop = undefined;
commandMgr.registerCommand(
  new Command(
    "nv",
    "夜视",
    (a0) => {
      switch (a0) {
        case "on":
          if (!nvloop)
            nvloop = setInterval(() =>
              clientInstance.connection.queue("mob_effect", {
                runtime_entity_id: gameData.runtime_entity_id,
                event_id: "update",
                effect_id: 16,
                amplifier: 1,
                particles: false,
                duration: 20 * 60,
                tick: 0,
              })
            );
          commandMgr.sendMessage("夜视已开启");
          break;
        case "off":
          clearInterval(nvloop);
          commandMgr.sendMessage("夜视已关闭");
          break;
      }
    },
    [argumentTypes.enum(["on", "off"])]
  )
);

/**
 * 0:all
 * 1:normal
 * 2:blocks_only
 */
var dplevel = 1;
let dphandler = ({ name, params }, des) => {
  if (
    name == "level_event" &&
    /.*particle.*/.exec(params.event) &&
    (dplevel == 1 || dplevel == 0)
  ) {
    des.canceled = true;
  }
  if (name == "spawn_particle_effect" && (dplevel == 2 || dplevel == 0)) {
    des.canceled = true;
  }
};
function dpenable() {
  clientInstance.connection.off("clientbound", dphandler);
  clientInstance.connection.on("clientbound", dphandler);
  commandMgr.sendMessage("已开启禁用粒子显示");
}
commandMgr.registerCommand(
  new Command(
    "disableparticles",
    "禁用世界粒子（方块破坏等），减少卡顿",
    (a0) => {
      switch (a0) {
        case "all":
          dplevel = 0;
          dpenable();
          break;
        case "block":
          dplevel = 1;
          dpenable();
          break;
        case "normal":
          dplevel = 2;
          dpenable();
          break;
        case "off":
          clientInstance.connection.off("clientbound", dphandler);
          commandMgr.sendMessage("已关闭禁用粒子显示");
          break;
      }
    },
    [argumentTypes.enum(["all", "block", "normal", "off"])]
  )
);

let schathandler = ({ name, params }, des) => {
  if (name == "text") {
    params.message = strFromUnicode(params.message);
  }
};
commandMgr.registerCommand(
  new Command(
    "specialchat",
    "允许在聊天消息中使用例如\\u00a7、\\n的特殊字符转义",
    (a) => {
      switch (a) {
        case "on":
          clientInstance.connection.on("serverbound", schathandler);
          commandMgr.sendMessage("已开启聊天特殊字符转义");
          break;
        case "off":
          clientInstance.connection.off("serverbound", schathandler);
          commandMgr.sendMessage("已关闭聊天特殊字符转义");
          break;
      }
    },
    [argumentTypes.enum(["on", "off"])]
  )
);

const mp = new NBSPlayer();
mp.event.on("playNotes", (notes) => {
  notes.forEach((n) => {
    clientInstance.hitBlock(noteblocks[n]);
  });
});
let mploaded = false;
let mpsetuped = false;
mp.event.once("load", () => {
  mploaded = true;
});

mp.event.on("play", (s) => {
  clientInstance.sendToast(
    "[Notebot] 正在演奏",
    `${s.importName}-${s.name}-${s.author}`
  );
});
let noteblocks = [];
let currentnb = 0;
let nbselector = ({ name, params }, des) => {
  if (name == "inventory_transaction") {
    if (params.transaction.transaction_type == "item_use") {
      if (params.transaction.transaction_data.action_type == "click_block") {
        let pos = params.transaction.transaction_data.block_position;
        if (noteblocks.includes(pos)) {
          clientInstance.showMessage("\u00a7c请勿重复点击相同的音符盒！");
          return;
        }
        noteblocks[currentnb] = pos;
        des.canceled = true;
        currentnb++;
        clientInstance.showMessage(
          `请依次右键25个不同的音符盒(${currentnb}/25)`
        );
        if (currentnb >= 25) {
          clientInstance.showMessage("notebot初始化完成！");
          mpsetuped = true;
          clientInstance.connection.off("serverbound", nbselector);
        }
      }
    }
  }
};
commandMgr.registerCommand(
  new Command(
    "notebot",
    "音符盒机器人",
    async (a, n) => {
      if (a == "list") {
        commandMgr.sendMessage("发现的音符盒文件：\n", dir("./songs", ".nbs"));
      }
      if (a == "savenoteblocks") {
        if (!n) {
          commandMgr.emit("error", "请提供配置名称");
          return;
        }
        if (/\/|\\|\?|\:/.test(n)) {
          commandMgr.emit("error", "配置不能包含特殊字符。");
          return;
        }
        if (!mpsetuped) {
          commandMgr.emit(
            "error",
            "音乐播放器未初始化，输入.notebot setup完成初始化。"
          );
          return;
        }
        const fcontent = JSON.stringify(noteblocks);
        try {
          fs.mkdirSync("notebot", { recursive: true });
          fs.writeFileSync(`./notebot/${n}.noteblocks.json`, fcontent);
          commandMgr.sendMessage("保存", n, "成功！");
        } catch (e) {
          commandMgr.emit("error", `在保存配置${n}时出错：${e.stack}`);
        }
      } else if (a == "loadnoteblocks") {
        if (!n) {
          commandMgr.emit("error", "请提供配置名称");
          return;
        }
        if (/\/|\\|\?|\:/.test(n)) {
          commandMgr.emit("error", "配置不能包含特殊字符。");
          return;
        }
        try {
          noteblocks = JSON.parse(
            fs.readFileSync(`./notebot/${n}.noteblocks.json`).toString()
          );
          console.log(noteblocks);
          commandMgr.sendMessage("加载配置", n, "成功！");
          mpsetuped = true;
        } catch (e) {
          commandMgr.emit("error", `在加载配置${n}时出错：${e}`);
        }
      }
      if (!mploaded) {
        commandMgr.emit("error", "音乐播放器未加载完成");
        return;
      }
      if (!mpsetuped && a != "setup") {
        commandMgr.emit(
          "error",
          "音乐播放器未初始化，输入.notebot setup完成初始化"
        );
        return;
      }
      if (a == "setup") {
        currentnb = 0;
        clientInstance.showMessage("请依次右键25个不同的音符盒(0/25)");
        clientInstance.connection.on("serverbound", nbselector);
      }
      if (a == "play") {
        if (!n) {
          commandMgr.emit("error", "请提供歌曲名称！");
        } else {
          var success = true;
          commandMgr.sendMessage("正在加载歌曲。。。");
          await pwait(10);
          await mp.loadSong(n).catch((r) => {
            commandMgr.emit("error", "加载失败:", r);
            success = false;
          });
          if (success) {
            commandMgr.sendMessage("加载成功");
            mp.play();
          }
        }
      } else if (a == "stop") {
        mp.stop();
        commandMgr.sendMessage("已暂停播放");
      } else if (a == "continue") {
        mp.continue();
      } else if (a == "tune") {
        noteblocks.forEach((v, i, a) => {
          console.log(v);
          for (let _ = 0; _ < i; _++) {
            setTimeout(() => {
              clientInstance.clickBlock(v);
            }, _ * 500);
          }
        });
      }
    },
    [
      argumentTypes.enum([
        "setup",
        "play",
        "continue",
        "stop",
        "savenoteblocks",
        "loadnoteblocks",
        "list",
        "tune",
      ]),
      argumentTypes.optional.string("arg1[name/profile]"),
    ]
  )
);
class Queue {
  items = [];
  index = 0;
  constructor() {}
  add(v) {
    if (this.items.includes(v)) {
      throw `${v}已经在队列中`;
    }
    this.items.push(v);
  }
  remove(v) {
    this.items = this.items.filter((v1) => {
      return v1 != v;
    });
    if (this.index >= this.items.length) {
      this.index = this.items.length - 1;
    }
  }
  next() {
    this.index++;
    if (this.index > this.items.length - 1) {
      this.index = 0;
    }
    return this.items[this.index];
  }
  last() {
    this.index--;
    if (this.index < 0) {
      this.index = this.items.length;
    }
    return this.items[this.index];
  }
  clear() {
    this.items = [];
    this.index = 0;
  }
  current() {
    return this.items[this.index];
  }
}
const nbqueue = new Queue();
function nbqListener() {
  commandMgr.run(`.notebot play "${nbqueue.next()}"`);
}
commandMgr.registerCommand(
  new Command(
    "notebot-queue",
    "队列播放nbs音乐",
    async (a0, a1) => {
      if (!mpsetuped) {
        commandMgr.error("请先输入.notebot setup来初始化");
        return;
      }
      switch (a0) {
        case "start":
          if (nbqueue.items.length == 0) {
            commandMgr.error("请先添加歌曲");
            return;
          }
          commandMgr.run(`.notebot play "${nbqueue.current()}"`);
          mp.event.on("finish", nbqListener);
          break;
        case "stop":
          commandMgr.run(`.notebot stop`);
          mp.event.off("finish", nbqListener);
          break;
        case "add":
          if (!a1) {
            commandMgr.emit("error", "请提供歌曲名称！");
          } else {
            if (fs.existsSync(path.join(__dirname, a1))) {
              nbqueue.add(a1);
              commandMgr.sendMessage("已添加曲目");
            } else {
              commandMgr.error("文件不存在！");
            }
          }
          break;
        case "remove":
          if (!a1) {
            commandMgr.emit("error", "请提供歌曲名称！");
          } else {
            nbqueue.remove(a1);
          }
          break;
        case "list":
          commandMgr.sendMessage(
            "目前队列内容：\n",
            nbqueue.items.join("\n- ")
          );
          break;
        case "clear":
          nbqueue.clear();
          commandMgr.sendMessage("已清空队列");
          break;
      }
    },
    [
      argumentTypes.enum(["start", "stop", "add", "remove", "list", "clear"]),
      argumentTypes.optional.string("name"),
    ]
  )
);

commandMgr.registerCommand(
  new Command(
    "test",
    "Test.",
    (a) => {
      clientInstance.connection.queue("debug_renderer", {
        type: "add_cube",
        text: a,
        position: gameData.player_position,
        red: 1.0,
        green: 0.0,
        blue: 0.0,
        alpha: 1.0,
        duration: 10000,
      });
    },
    [argumentTypes.string("text to display")],
    true
  )
);

commandMgr.registerCommand(
  new Command("info", "输出信息", () => {
    clientInstance.sendMessage(
      `我正在使用[\u00a7a\u00a7l苦力怕代理\u00a7r]，一款没有作弊性质的生电工具！\n作者：HowieNB\n版本：${
        isDevEnv ? "开发版" : "发布版"
      }${VERSION}\n\u00a7b\u00a7l开发版本：以下为调试信息\u00a7r\n世界种子:${
        gameData.seed
      }\n玩家实体ID：${gameData.runtime_entity_id}`
    );
  })
);

commandMgr.registerCommand(
  new Command(
    "whereis",
    "玩家的位置",
    (name) => {
      let pos = { x: 0, y: 0, z: 0 };
      let dim = "overworld";

      if (name == clientInstance.connection.profile.name) {
        pos = gameData.player_position;
        dim = gameData.dimension;
      } else {
        if (!clientInstance.__playerByName_mappings[name]) {
          commandMgr.emit("error", "玩家不存在或不曾在加载范围内出现");
          return;
        }
        pos = clientInstance.playerByName(name).position;
        dim = clientInstance.playerByName(name).dimension;
      }
      commandMgr.sendMessage(
        `玩家${name}最后一次出现于X:${pos.x},Y:${pos.y},Z:${pos.z} 维度：${dim}`
      );
      if (gameData.dimension !== dim) {
        commandMgr.sendMessage(
          `\u00a7e由于您与目标玩家不在同一维度中，结果不一定准确`
        );
      }
    },
    [argumentTypes.string("name")]
  )
);

//#endregion

var tickFn = setInterval(() => {
  clientInstance.tick += 1;
  clientInstance.events.emit("tick", clientInstance.tick);
}, 50);

//#region main
async function main() {
  if (config.realms.enabled) {
    logger.info("Enabled realms");
    let flow = new Authflow(undefined, undefined, undefined, (res) => {
      logger.info(
        "请通过以下链接登陆您的Microsoft账户。\n",
        (res.verification_uri + "?otc=" + res.user_code).underline.bold
      );
    });
    let rapi = realms.RealmAPI.from(flow, "bedrock");
    await rapi.getRealms().then((rs) => {
      console.log(rs);
      rs.forEach((r) => {
        if (config.realms.name == r.name) {
          realm = r;
          r.remoteSubscriptionId;
        }
      });
      if (!realm) {
        logger.error("没有领域服匹配");
      }
      logger.info("选中领域服：", realm);
      relay = new bedrock.Relay({
        host: "127.0.0.1",
        port: 19132,
        forceSingle: true,
        motd: {
          motd: "\u00a7a\u00a7l苦力怕代理",
          levelName: `${config.realms.enabled ? "Realms" : "服务器"}:${
            config.realms.enabled
              ? realm.name
              : config.serverHost + ":" + config.serverPort.toString()
          }`,
        },
        maxPlayers: 1,
        onMsaCode: (res, c) => {
          logger.info(
            "请通过以下链接登陆您的Microsoft账户。\n",
            (res.verification_uri + "?otc=" + res.user_code).underline.bold
          );
          c.queue("disconnect", {
            reason: "disconnected",
            hide_disconnect_reason: false,
            message:
              "请在后台查看链接并登录或进入" +
              res.verification_uri +
              "?otc=" +
              res.user_code +
              "进行登陆。",
          });
        },
        raknetBackend: "raknet-native",
        destination: {
          realms: {
            realmId: realm.id.toString(),
          },
        },
      });
    });
  } else {
    relay = new bedrock.Relay({
      host: "0.0.0.0",
      port: 19132,
      forceSingle: true,
      destination: {
        host: config.serverHost,
        port: config.serverPort,
      },
    });
  }
  relay.on(
    "connect",
    /**
     * @param {bedrock.Player} p
     */
    (p) => {
      clientInstance.connection = p;
      clientInstance.connection.setMaxListeners(114514);
      world.setConnection(clientInstance.connection);
      camera.connection = clientInstance.connection;
      logger.info(tr("player.connected", p.connection.address));
      commandMgr.removeAllListeners();
      commandMgr.on("error", (...msg) => {
        clientInstance.showMessage("> \u00a7c", ...msg);
      });
      commandMgr.on("message", (...msg) => {
        clientInstance.showMessage("> ", ...msg);
      });
      p.on("clientbound", ({ name, params }, des) => {
        try {
          switch (name) {
            case "start_game":
              if (settings.force_achievement_enabled) {
                params.achievements_disabled = true;
              } else {
                params.achievements_disabled = false;
              }
              Object.assign(gameData, params);
              break;
            case "game_rules_changed":
              gameData.gamerules = params.rules;
              break;
            case "mob_equipment":
              if (
                params.runtime_entity_id == gameData.runtime_entity_id &&
                params.selected_slot == params.slot
              )
                gameData.selected_item = params.item;
              gameData.selected_slot = params.selected_slot;
              break;
            case "play_status":
              if (params.status == "player_spawn") {
                clientInstance.events.emit("spawn");
                clientInstance.sendToast(
                  tr("app.name.ingame"),
                  tr("msg.toast.welcome")
                );
                logger.info(tr("player.spawned"));
              }
              break;
            case "disconnect":
              logger.info(
                tr(
                  "player.disconnected",
                  params.reason,
                  params.message ?? "(undefined)"
                )
              );
              break;
            case "player_list":
              logger.info("player_list:", params);
              switch (params.records.type) {
                case "add":
                  params.records.records.forEach((p) => {
                    clientInstance.players[p.uuid] = p;
                  });
                  break;
                case "remove":
                  params.records.records.forEach((p) => {
                    delete clientInstance.players[p.uuid];
                  });
                  break;
              }
              break;
            case "add_player":
              clientInstance.players[params.uuid] = params;
              clientInstance.entityPlayers[params.runtime_id] = params;
              clientInstance.__playerByName_mappings[params.username] =
                params.runtime_id;
              break;
            case "move_player":
              if (clientInstance.entityPlayers[params.runtime_id]) {
                clientInstance.entityPlayers[params.runtime_id].position =
                  params.position;
                clientInstance.entityPlayers[params.runtime_id].dimension =
                  gameData.dimension;
              }
              break;
            case "change_dimension":
              gameData.dimension = hardcoded_dimensions[params.dimension];
              break;
          }
        } catch (e) {
          logger.error(e);
        }
      });

      p.on("serverbound", ({ name, params }, des) => {
        try {
          if (name == "text") {
            console.log(params);
            des.canceled = commandMgr.run(params.message);
          }
          if (name == "command_request") {
            logger.debug(params);
          }
          if (name == "player_auth_input") {
            if (!freeCam) gameData.player_position = params.position;
            else {
              cameraPos = cameraPos.add(
                new Vector3(
                  params.delta.x * cameraSpeed_,
                  params.input_data.sneaking
                    ? -1
                    : params.input_data.jumping
                    ? 1
                    : 0,
                  params.delta.z * cameraSpeed_
                )
              );
              cameraRot = { x: params.pitch, z: params.head_yaw };
              clientInstance.tp(
                gameData.player_position,
                params.pitch,
                params.yaw,
                params.head_yaw
              );
              //console.log(cameraPos)
              camera.move(
                { x: cameraPos.x, y: cameraPos.y, z: cameraPos.z },
                cameraRot
              );
            }
          }
          if (name == "mob_equipment" && params.selected_slot == params.slot) {
            gameData.selected_item = params.item;
            gameData.selected_slot = params.selected_slot;
          }
          if (name == "inventory_transaction") {
            console.log(params);
          }
          if (name == "adventure_settings") {
            console.log(params);
          }
        } catch (e) {
          logger.error(e);
          clientInstance.showMessage("> \u00a7c", e.stack);
        }
      });
    }
  );
  relay.listen().catch((error) => {
    logger.error(error);
    logger.info(
      "代理发生错误，请检查您的地址是否正确或领域服正则表达式是否有效。"
    );
    process.exit(1);
  });
  //#region Banner
  logger.info(
    `\n
     ____   ____    _____   _____   ____    _____   ____      ____    _____   _          _     __   __
    / ___| |  _ \\  | ____| | ____| |  _ \\  | ____| |  _ \\    |  _ \\  | ____| | |        / \\    \\ \\ / /
   | |     | |_) | |  _|   |  _|   | |_) | |  _|   | |_) |   | |_) | |  _|   | |       / _ \\    \\ V / 
   | |___  |  _ <  | |___  | |___  |  __/  | |___  |  _ <    |  _ <  | |___  | |___   / ___ \\    | |  
    \\____| |_| \\_\\ |_____| |_____| |_|     |_____| |_| \\_\\   |_| \\_\\ |_____| |_____| /_/   \\_\\   |_|  

    ${tr("app.name")} -- a toolbox for Minecraft:Bedrock Edition
             By ${"HowieNB".rainbow}
    `.green
  );
  //#endregion
  logger.info(tr("server.started"));
}
//#endregion main
main().catch((r) => {
  logger.error(r);
});
