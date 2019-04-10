import m from 'mithril'
import validator from 'validator'
import deserialize from '../utils/safe-deserialize'
import hmac from '../utils/hmac'

export default {
  server: null,
  id: null,
  username: null,
  secret: null,

  error: null,

  async load() {
    const data = await browser.storage.local.get('Authentication')

    if (data.Authentication) {
      this.server = data.Authentication.server
      this.id = data.Authentication.id
      this.username = data.Authentication.username
      this.secret = data.Authentication.secret

      m.redraw()
    }
  },

  async store() {
    await browser.storage.local.set({
      Authentication: {
        server: this.server,
        id: this.id,
        username: this.username,
        secret: this.secret,
      }
    })
  },

  get isAuthenticated() {
    return !!(this.id && this.secret && this.server)
  },

  async signUp(password, passwordConfirmation) {
    this.error = null
    this.validateSignUp(password, passwordConfirmation)
    if (this.error)
      return

    this.server = formatUrl(this.server)

    try {
      await m.request({
        method: 'POST',
        url: this.server + '/users',
        data: {
          username: this.username,
          password: password
        },
        deserialize
      })

      this.store()
    } catch (error) {
      this.error = error
      console.log(`Error: [${error.constructor.name}] (${error.code}) ${error.message} - ${error}`)
    }
  },

  async logIn(password) {
    this.server = formatUrl(this.server)

    this.error = null
    this.validateLogIn(password)
    if (this.error)
      return

    try {
      const response = await m.request({
        method: 'POST',
        url: this.server + '/users/auth',
        data: {
          username: this.username,
          password: password
        },
        deserialize
      })

      this.id = response.id
      this.username = response.username
      this.secret = response.secret

      this.store()
    } catch (error) {
      this.error = error
      console.log(`Error: [${error.constructor.name}] (${error.code}) ${error.message} - ${error}`)
    }
  },

  validateSignUp(password, passwordConfirmation) {
    const errors = []

    if (!validator.isLength(this.username || '', { min: 3 })) // TODO: trim username? I should do it serverside too
      errors.push('username too short (must be at leat 3 characters)')

    if (!validator.isLength(password || '', { min: 8 }))
      errors.push('password too short (must be at leat 8 characters)')

    if (password !== passwordConfirmation)
      errors.push('you entered two diffrerent passwords')

    if (!validator.isURL(this.server || ''))
      errors.push('Invalid server address')

    this.error = errors.length > 0 ? errors : null
  },

  validateLogIn(password) {
    const errors = []

    if (!validator.isLength(this.username || '', { min: 3 })) // TODO: trim username? I should do it serverside too
      errors.push('username too short (must be at leat 3 characters)')

    if (!validator.isLength(password || '', { min: 8 }))
      errors.push('password too short (must be at leat 8 characters)')

    if (!validator.isURL(this.server || ''))
      errors.push('Invalid server address')

    this.error = errors.length > 0 ? errors : null
  },

  get SignUpErrorText() { // TODO: find a way to DRY validation & error code
    if (Array.isArray(this.error))
      return this.error.join('\n')

    switch (this.error.code) {
      case 400: return 'Bad Request: Missing username or password'
      case 409: return 'Conflict: This username is taken'
      case 500: return 'Internal Server Error: Retry later'
      case 0: return 'Server is unreachable'

      case 12: return 'Invalid server address' // value from DOMException, others are from xhr.status
      case null:
      case undefined: return `Unexpected error: ${error.message}`

      default: return `Unexpected network error: ${httpStatus[code]} (${code})`
    }
  },

  get logInErrorText() {
    if (Array.isArray(this.error))
      return this.error.join('\n')

    switch (this.error.code) {
      case 401: return 'Unauthorized: Wrong username or password'
      case 400: return 'Bad Request: Missing username or password'
      case 500: return 'Internal Server Error: Retry later'
      case 0: return 'Server is unreachable'

      case 12: return 'Invalid server address' // value from DOMException, others are from xhr.status
      case null:
      case undefined: return `Unexpected error: ${error.message}`

      default: return `Unexpected network error: ${httpStatus[code]} (${code})`
    }
  }
}

function formatUrl(uncheckedUrl) {
  const url = uncheckedUrl || ''
  return (url.match(/^\s*https?:\/\//) ? '' : 'http://') + url.trim()
}

// TODO: test the models / switch to TDD
// TODO: when the user closes the browser_action page during a request, the response is never processed, maybe I should use a background script for important tasks like sign-up / log-in etc. Maybe the whole model layer could run in a background script?
// TODO: logOut
