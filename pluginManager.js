const log4js = require("log4js");
const { CommandManager } = require("./command");
const { Connection, Player } = require("bedrock-protocol");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {{instance:any,info:any}} Plugin
 * @typedef {{uuid:string,}} NetworkPlayer
 * @typedef {{tick:number,players: Record<string,Player>,connection: Player|undefined,events:EventEmitter,getGameData:()=>Record<string,any>,sendToast:(title, text)=>void,showMessage:(...text)=>void,sendMessage:(...text)=>void,runCommand:(cmd)=>void,tp:(pos, pitch, yaw, head_yaw)=>void,disconnect:()=>void,interact:(mode:"normal"|"inventory_mismatch"|"item_use"|"item_use_on_entity"|"item_release")=>void}} Plugin
 */

class PluginManager {
  plugins = [];
  constructor(p = "./plugins/", logger = console, context = {}) {
    if (!fs.existsSync(path.join(__dirname, p))) {
      fs.mkdirSync(path.join(__dirname, p));
    }
    const plugins = fs.readdirSync(path.join(__dirname, p));
    plugins.forEach((v) => {
      try {
        const isDir = fs.statSync(path.join(__dirname, p, v)).isDirectory();
        if (isDir) {
          const pluginInfo = JSON.parse(
            fs
              .readFileSync(path.join(__dirname, p, v, "plugin.json"))
              .toString()
          );
          var plugin = {
            instance: (() => {
              try {
                return require(path.join(__dirname, p, v, pluginInfo.entry));
              } catch (e) {
                logger.error(
                  "在加载插件",
                  pluginInfo.name,
                  "时发生错误：",
                  e.stack
                );
                return undefined;
              }
            })(),
            info: pluginInfo,
          };
          if (plugin.instance) this.plugins.push(plugin);
          plugin.instance(context);
          console.log(
            "加载插件:",
            pluginInfo.name + " - " + pluginInfo.description
          );
        }
      } catch (err) {
        logger.error("%s不是有效的插件", v, ":", err);
      }
    });
  }
}
module.exports.PluginManager = PluginManager;
