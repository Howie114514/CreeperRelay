const { readFileSync, writeFileSync } = require("fs");
const { floorMod } = require("./utils");
const EventEmitter = require("events");

class NBSPlayer {
  notes = {};
  tick = 0;
  length = 0;
  tickInterval = setInterval(() => {
    if (this.playing) {
      this.tick++;
      if (this.notes[this.tick]) {
        this.event.emit("playNotes", this.notes[this.tick]);
      }
      if (this.tick > this.song.getLength()) {
        this.playing = false;
        this.event.emit("finish");
      }
    }
  }, 50);
  event = new EventEmitter();
  playing = false;
  constructor() {
    this.setup();
  }
  async setup() {
    const { fromArrayBuffer } = await import("@encode42/nbs.js");
    this.fromArrayBuffer = fromArrayBuffer;
    this.event.emit("load");
  }
  async loadSong(f) {
    this.notes = {};
    const originalFile = readFileSync(f);
    const originalBuffer = new Uint8Array(originalFile).buffer;
    this.song = this.fromArrayBuffer(originalBuffer);
    var notes1 = 0;
    for (const layer of this.song.layers) {
      for (const [tick, note] of layer.notes) {
        if (!this.notes[tick]) {
          this.notes[tick] = [];
        }
        let k = note.key - 33;
        if (k < 0) {
          //console.warn(`音符@${tick}:${k}低于2倍频程限制！将进行升调处理。`);
          k = floorMod(k, 12);
        } else if (k > 24) {
          //console.warn(`音符@${tick}:${k}高于2倍频程限制！将进行降调处理。`);
          k = floorMod(k, 12) + 12;
        }
        this.notes[tick].push(k);
      }
      notes1 += layer.notes.total;
    }
    console.log("加载", this.song.name, `[${f}]`, "完成,音符总数：", notes1);
  }
  play() {
    if (!this.song) {
      console.warn("没有加载歌曲！");
      return;
    }
    this.tick = 0;
    this.playing = true;
    this.event.emit("play", this.song);
  }
  continue() {
    if (!this.song) {
      console.warn("没有加载歌曲！");
      return;
    }
    this.playing = true;
  }
  stop() {
    this.playing = false;
  }
}
module.exports.NBSPlayer = NBSPlayer;
