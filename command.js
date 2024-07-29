/**
 * @typedef {{type:"string"|"number"|"enum",items:string[]|undefined,optional:boolean,name:string}} CommandArgumentType
 */

const { EventEmitter } = require("events");
const { replaceCharAt } = require("./utils");

/**
 * @member {string} prefix
 */
module.exports.CommandManager = class extends EventEmitter {
  prefix = ".";
  /**
   * @type {Record<string,Command>}
   */
  commands = {};
  /**
   * @param {string} prefix
   */
  constructor(logger = console, prefix = ".") {
    super();
    this.logger = logger;
    this.prefix = prefix;
    this.on("error", (e) => {
      logger.error(e);
    });
    this.registerCommand(
      new Command("help", "显示帮助", (...args) => {
        let str = "";
        Object.keys(this.commands).forEach((k) => {
          if (this.commands[k].hidden) return;
          str += this.commands[k].name + " ";
          this.commands[k].argList.forEach((v) => {
            str += `${v.optional ? "[" : "<"}${v.name ? v.name + ":" : ""}${
              v.type == "enum" ? v.items.join("|") : v.type
            }${v.optional ? "]" : ">"} `;
          });
          str += " - " + this.commands[k].description + "\n ";
        });
        this.sendMessage("命令列表↴\n", str);
      })
    );
  }
  error(...text) {
    this.emit("error", text.join(" "));
  }
  /**
   *
   * @param {Command} cmd
   */
  registerCommand(cmd) {
    this.commands[cmd.name] = cmd;
  }
  /**
   *
   * @param {string} cmd
   */
  toArgumentArray(cmd) {
    let _cmd = cmd.replace(/\"(.*?)\"/g, (str) => {
      let res = str;
      res = res.substring(1, res.length - 1);
      return res.replace(/\s/g, "\ue001__SPACE__\ue001");
    });
    let args = _cmd.split(" ");
    args.forEach((v, i) => {
      args[i] = v.replace(/\ue001__SPACE__\ue001/g, " ");
    });
    this.logger.debug("解析命令", args);
    return args;
  }
  sendMessage(...message) {
    this.emit("message", message.join(" "));
  }
  /**
   *
   * @param {string[]} args
   * @param {CommandArgumentTypes[]} types
   */
  checkArguments(args, types, minl, maxl) {
    let si = 1;
    let res = args;
    this.logger.info(res);
    let mistakes = [];
    let correct = true;

    if (res.length >= minl && res.length <= maxl) {
      res.forEach((v, i) => {
        si += v.length + 1;
        this.logger.info(v);
        switch (types[i].type) {
          case "number":
            let n = parseFloat(v);
            if (n != n) {
              mistakes.push(si);
              correct = false;
            } else {
              res[i] = n;
            }
            break;
          case "string":
            break;
          case "enum":
            if (!types[i].items) {
              throw Error("未指定枚举内容");
            } else if (!types[i].items.includes(v)) {
              this.emit("error", "没有可用的选项：", v);
              mistakes.push(si);
              correct = false;
            }
            break;
        }
      });
    } else {
      this.emit(
        "error",
        `命令需要${types.length}个参数，您提供了${res.length}个参数。`
      );
      correct = false;
      mistakes.push(0);
    }

    return { correct, argList: res, mistakes };
  }
  /**
   *
   * @param {string} cmd
   */
  run(cmd) {
    if (!cmd.startsWith(this.prefix)) {
      return false;
    }
    let args = this.toArgumentArray(cmd);
    let command = this.commands[args[0].slice(1)];
    if (!command) {
      this.emit("error", `\u00a7c没有名为 "${args[0]}" 的命令`);
      return true;
    } else {
      args = args.splice(1);
      let _args = this.checkArguments(
        args,
        command.argList,
        command.minalength,
        command.maxalength
      );
      if (!_args.correct) {
        this.logger.info("不正确的命令");
        let mis = " ".repeat(cmd.length);
        _args.mistakes.forEach((v) => {
          mis = replaceCharAt(mis, v, "^");
        });
        this.logger.info(_args.argList);
        this.emit(
          "error",
          `命令在字符${_args.mistakes.join(",")}处 共存在${
            _args.mistakes.length
          }处错误\n${cmd}\n${mis}`
        );
      } else {
        args = _args.argList;
        try {
          command.callback.apply(null, args);
        } catch (e) {
          this.logger.error(e);
        }
      }

      return true;
    }
  }
};

module.exports.argumentTypes = {
  string(name) {
    return { type: "string", name: name };
  },
  number(name) {
    return { type: "number", name: name };
  },
  enum(items, name) {
    return { type: "enum", items, name: name };
  },
  optional: {
    string(name) {
      return { type: "string", name: name, optional: true };
    },
    number(name) {
      return { type: "number", name: name, optional: true };
    },
    enum(items, name) {
      return { type: "enum", items, name: name, optional: true };
    },
  },
};

class Command {
  name;
  callback;
  description;
  argList;
  minalength = 0;
  maxalength = 0;
  hidden = false;
  /**
   *
   * @param {string} name
   * @param {string} description
   * @param {Function} callback
   * @param {CommandArgumentType[]} argList
   */
  constructor(name, description, callback, argList = [], hidden = false) {
    this.name = name;
    this.callback = callback;
    this.description = description;
    this.argList = argList;
    var opt = false;
    this.hidden = hidden;
    argList.forEach((v) => {
      if (!v.optional) {
        if (opt) {
          throw Error(`必选项必须在可选项之前。`);
        }
        this.minalength += 1;
      } else {
        opt = true;
      }
      this.maxalength += 1;
    });
  }
}
module.exports.Command = Command;
