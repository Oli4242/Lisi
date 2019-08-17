global.chai = require('chai')
global.expect = chai.expect
global.pending = () => it('')

chai.use(require('chai-as-promised'))
chai.use(require('chai-change'))
chai.use(require('chai-http'))

global.request = chai.request

describe('Lisi server', () => {
  require('./models/user')
  require('./models/link')
  require('./utils/auth-middleware')
  require('./routes/users')
  require('./routes/links')
})
