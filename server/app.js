const express = require('express')
const users = require('./routes/users')
const links = require('./routes/links')
const app = express()

app.use(express.json())
users.use('/:userId/links', links)
app.use('/users', users)

app.get('/', (req, res) => res.send(true))

module.exports = app
