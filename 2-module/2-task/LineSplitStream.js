const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.remainder = '';
    this.hasRemaind = false;
  }

  _transform(chunk, encoding, callback) {
    chunk = chunk.toString();
    const chunks = chunk.split(os.EOL);

    if (this.hasRemaind) {
      chunks[0] = this.remainder + chunks[0];
      this.hasRemaind = false;
    }

    this.remainder = chunks.splice(chunks.length - 1, 1);
    if (this.remainder !== '') this.hasRemaind = true;

    for (const chunk of chunks) {
      this.push(chunk.toString());
    }

    callback();
  }

  _flush(callback) {
    callback(null, this.remainder.toString());
  }
}

module.exports = LineSplitStream;
