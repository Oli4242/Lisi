const express = require('express')
const { User } = require('../../models')
const authMiddleware = require('../../utils/auth-middleware')
const { security } = require('../../settings')
const hmac = require('../../utils/hmac')

describe('testApp', () => {
  let testApp, givenUser, givenUser2

  before(async () => {
    testApp = express()
    testApp.use(express.json())
    testApp.get('/test/:userId', authMiddleware, (req, res) => res.sendStatus(200))
    testApp.get('/fail', authMiddleware, (req, res) => res.sendStatus(200))

    givenUser = await User.create({
      username: 'Bob',
      password: '12345678'
    })
    givenUser2 = await User.create({
      username: 'Bob2',
      password: 'abcdefgh'
    })
  })

  after(async () => {
    User.truncate()
  })

  context('on happy path', () => {
    it('grants access', async () => {
      const url = '/test/' + givenUser.id
      const secret = givenUser.secret
      const method = 'GET'
      const body = { foo: 'bar' }
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify(body), secret, 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
        .send(body)
      expect(response).to.have.status(200)
    })
  })

  context('on bad path', () => {
    it('denies access to wrong users', async () => {
      const url = '/test/' + givenUser2.id
      const secret = givenUser.secret
      const method = 'GET'
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify({}), secret, 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
      expect(response).to.have.status(401)
    })

    it('denies access to non existant users', async () => {
      const url = '/test/' + givenUser2.id + 1
      const secret = givenUser2.secret
      const method = 'GET'
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify({}), secret, 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
      expect(response).to.have.status(401)
    })

    it('denies access when the user is not specified', async () => {
      const url = '/fail'
      const secret = givenUser.secret
      const method = 'GET'
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify({}), secret, 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
      expect(response).to.have.status(401)
    })

    it('denies access when the signature does not match the request', async () => {
      const url = '/test/' + givenUser.id
      const secret = givenUser.secret
      const method = 'POST'
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify({}), secret, 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
      expect(response).to.have.status(401)
    })

    it('denies access when the request is signed with a wrong secret', async () => {
      const url = '/test/' + givenUser.id
      const method = 'GET'
      const signature = hmac(method + '\n' + url + '\n' + JSON.stringify({}), 'a wrong secret', 'base64')
      const response = await request(testApp).get(url)
        .set('Authorization', signature)
      expect(response).to.have.status(401)
    })

    it('denies access when the signature is missing', async () => {
      const url = '/test/' + givenUser.id
      const secret = givenUser.secret
      const response = await request(testApp).get(url)
      expect(response).to.have.status(401)
    })
  })
})

// TODO: test if it uses correctly `res.locals.userId` when set.
