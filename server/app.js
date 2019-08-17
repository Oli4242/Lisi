const express = require('express')
const users = require('./routes/users')
const links = require('./routes/links')
const app = express()
const authMiddleware = require('./utils/auth-middleware')

app.use(express.json())
users.use('/:userId/links', authMiddleware, links)
app.use('/users', users)

app.get('/', (req, res) => res.send(true))

module.exports = app
