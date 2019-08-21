const bufferEq = require('buffer-equal-constant-time')
const { security } = require('../settings')
const { User } = require('../models')
const hmac = require('./hmac')

module.exports = async (req, res, next) => {
  if (!req.get('Authorization')) {
    return res.sendStatus(401)
  }

  const user = await User.findByPk(req.params.userId || res.locals.userId || null)
  if (!user) {
    return res.sendStatus(401) // Unauthorized
  }

  const stringToBesSigned = req.method + '\n' + req.originalUrl + '\n' + JSON.stringify(req.body)
  const expectedSignature = hmac(stringToBesSigned, user.secret, 'base64')
  const doubleHmacExpected = hmac(expectedSignature, user.secret)

  const receivedSignature = req.get('Authorization')
  const doubleHmacRecieved = hmac(receivedSignature, user.secret)

  if (bufferEq(doubleHmacExpected, doubleHmacRecieved)) {
    res.locals.currentUser = user // TODO: write a test for this behavior
    next()
  } else {
    res.sendStatus(401) // Unauthorized
  }
}

// TODO: timestamps to prevent replay attacks
