const router = require('express').Router()
const authMiddleware = require('../utils/auth-middleware')
const errorToResponse = require('../utils/error-to-response')
const Sequelize = require('sequelize')
const { Link } = require('../models')

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

router.get('/', authMiddleware, async (req, res) => {
  const links = await res.locals.currentUser.getLinks()
  const linksArray = links.map(link => ({
    id: link.id,
    url: link.url,
    note: link.note,
    title: link.title
  }))
  res.status(200).send({ links: linksArray })
})

router.get('/:linkId', authMiddleware, async (req, res) => {
  const link = await Link.findByPk(req.params.linkId)
  const currentUserId = res.locals.currentUser.id

  if (!link || link.userId !== currentUserId) { // the current user must know only about its own links so we return error 404 if the linkId exists but belongs to someone else
    res.sendStatus(404)
  } else {
    const { id, url, note, title } = link
    res.status(200).send({ id, url, note, title })
  }
})

router.delete('/:linkId', authMiddleware, async (req, res) => {
  const link = await Link.findByPk(req.params.linkId)
  const currentUserId = res.locals.currentUser.id

  if (!link || link.userId !== currentUserId) {
    res.sendStatus(404)
  } else {
    await link.destroy()
    res.sendStatus(200)
  }
})

module.exports = router
