const express = require('express')
const users = require('./routes/users')
const app = express()

app.use(express.json())
app.use('/users', users)

app.get('/', (req, res) => res.send(true))

module.exports = app
