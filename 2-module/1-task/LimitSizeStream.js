const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);

    this.limit = options.limit;
    this.currentLength = 0;
  }

  _transform(chunk, encoding, callback) {
    this.currentLength += this._writableState.length;

    if (this.currentLength > this.limit) callback(new LimitExceededError());

    callback(null, chunk);
  }
}

module.exports = LimitSizeStream;
