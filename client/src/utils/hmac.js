const crypto = require('crypto')

module.exports = (message, key, encoding = undefined) =>
  crypto.createHmac('sha256', key)
    .update(message)
    .digest(encoding) // (if encoding is undefined it'll return a Buffer)

// TODO: refactor and share this file with the server?
