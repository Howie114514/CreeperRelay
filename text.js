class RawText {
    components = [];
    toMCMessage() {
        return JSON.stringify({ rawtext: this.components })
    };
    text(text) {
        this.components.push({ text })
        return this
    };
    /**
     * 
     * @param {string} key 
     * @param {RawText} with_ 
     */
    translate(key, with_) {
        this.components.push({ translate: key, with: with_?.components })
    }
}
module.exports.RawText = RawText;