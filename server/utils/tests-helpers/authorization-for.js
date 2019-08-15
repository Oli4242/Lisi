const hmac = require('../hmac')

module.exports = function authorizationFor(user, method, url, body = {}) {
  const upperCaseMethod = method.toUpperCase()
  return hmac(`${upperCaseMethod}\n${url}\n${JSON.stringify(body)}`, user.secret, 'base64')
}
