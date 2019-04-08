const Sequelize = require('sequelize')
const router = require('express').Router()
const { randomBytes } = require('crypto')
const bcrypt = require('bcrypt')
const { User } = require('../models')
const errorToResponse = require('../utils/error-to-response')
const authMiddleware = require('../utils/auth-middleware')

router.get('/', (req, res) => res.sendStatus(405)) // Method Not Allowed

router.post('/', async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      secret: randomBytes(88).toString('base64') // 88 bytes in base64 = 64 char string = minimum required by secret field
    })
    res.sendStatus(201) // Created
  } catch (e) {
    const errorResponse = errorToResponse(e)
    // console.error(errorResponse) // TODO: use a logging library?
    // TODO: tester errorResponse dans les tests?

    if (e instanceof Sequelize.UniqueConstraintError)
      res.status(409).send(errorResponse) // Conflict
    else if (e instanceof Sequelize.ValidationError)
      res.status(400).send(errorResponse) // Bad Request
    else
      res.status(500).send(errorResponse) // Internal Server Error
  }
})

router.post('/auth', async (req, res) => {
  const { username, password } = req.body

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.sendStatus(400) // Bad Request
  }

  try {
    const user = await User.findOne({ where: { username } })

    if (!user) {
      // TODO: is timing attack a concern here? I could do a fake bcrypt.compare
      res.sendStatus(401) // Unauthorized
    } else if (await bcrypt.compare(password, user.password)) {
      res.status(200).send({
        id: user.id,
        username: user.username,
        secret: user.secret,
      })
    } else {
      res.sendStatus(401) // Unauthorized
    }
  } catch (e) {
    const errorResponse = errorToResponse(e)
    res.status(500).send(errorResponse)
  }
})

router.get('/:userId', authMiddleware, (req, res) => {
  const user = res.locals.currentUser
  res.status(200).send({
    id: user.id,
    username: user.username
  })
})

router.delete('/:userId', authMiddleware, async (req, res) => {
  await res.locals.currentUser.destroy()
  res.sendStatus(200) // OK
})

module.exports = router
