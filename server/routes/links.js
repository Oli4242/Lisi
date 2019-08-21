const router = require('express').Router()
const authMiddleware = require('../utils/auth-middleware')
const errorToResponse = require('../utils/error-to-response')
const Sequelize = require('sequelize')

router.post('/', authMiddleware, async (req, res) => {
  try {
    await res.locals.currentUser.createLink({
      url: req.body.url,
      note: req.body.note
    })
    res.sendStatus(201) // Created
  } catch (e) {
    const errorResponse = errorToResponse(e)

    if (e instanceof Sequelize.UniqueConstraintError)
      res.status(409).send(errorResponse) // Conflict
    else if (e instanceof Sequelize.ValidationError)
      res.status(400).send(errorResponse) // Bad Request
    else
      res.status(500).send(errorResponse) // Internal Server Error
  }
})

module.exports = router
