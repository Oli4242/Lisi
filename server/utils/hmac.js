const crypto = require('crypto')
const { security } = require('../settings')

module.exports = (message, key, encoding = undefined) =>
  crypto.createHmac(security.hmacAlgorithm, key)
    .update(message)
    .digest(encoding) // (if encoding is undefined it'll return a Buffer)
