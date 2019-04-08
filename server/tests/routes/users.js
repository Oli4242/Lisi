const app = require('../../app')
const { User, Link } = require('../../models')
const hmac = require('../../utils/hmac')
const { randomBytes } = require('crypto')

describe('/users', () => {
// TODO: test secret? -> could mock/spy randomBytes with sinon.js or something?
// TODO: test secret's uniqueness
  describe('POST /users', () => {
    context('on happy path', () => {
      afterEach(async () => {
        await User.truncate()
      })

      it('returns status 201 (Created)', async () => {
        const response = await request(app).post('/users').send({
          username: 'Bob',
          password: '12345678'
        })
        expect(response).to.have.status(201)
      })

      it('creates a new user', () => {
        const req = () => request(app).post('/users').send({
          username: 'Bob',
          password: '12345678'
        })
        return expect(req).to.alter(() => User.count(), { by: 1 })
      })
    })

    context('on sad path', () => {
      after(async () => {
        await User.truncate()
      })

      it('does not create a new user when username is not provided', () => {
        const req = () => request(app).post('/users').send({ password: '12345678' })
        return expect(req).to.alter(() => User.count(), { by: 0 })
      })

      it('does not create a new user when password is not provided', () => {
        const req = () => request(app).post('/users').send({ username: 'Bob' })
        return expect(req).to.alter(() => User.count(), { by: 0 })
      })

      it('returns status 400 (Bad Request)', async () => {
        const response = await request(app).post('/users').send({
          username: 'Bob'
        })
        expect(response).to.have.status(400)
      })

      it('returns status 409 (Conflict) when user already exists', async () => {
        await User.create({
          username: 'Bob',
          password: '12345678',
          secret: randomBytes(88).toString('base64')
        })
        const response = await request(app).post('/users').send({
          username: 'Bob',
          password: '87654321'
        })
        expect(response).to.have.status(409)
      })
    })
  })

  describe('POST /users/auth', () => { // TODO: bruteforce protection
    let givenUser

    before(async () => {
      givenUser = await User.create({
        username: 'Bob',
        password: '12345678'
      })
    })

    after(async () => {
      await User.truncate()
    })

    context('on happy path', () => {
      it('responds 200 (OK)', async () => {
        const response = await request(app).post('/users/auth').send({
          username: 'Bob',
          password: '12345678'
        })
        expect(response).to.have.status(200)
      })

      it('sends the the user id, name and secret as json', async () => {
        const response = await request(app).post('/users/auth').send({
          username: 'Bob',
          password: '12345678'
        })
        expect(response.body).to.deep.eql({
          id: givenUser.id,
          username: givenUser.username,
          secret: givenUser.secret
        })
      })
    })

    context('on bad path', () => {
      it('responds 401 (Unauthorized) when given a wrong username', async () => {
        const response = await request(app).post('/users/auth').send({
          username: 'Bobby',
          password: '12345678'
        })
        expect(response).to.have.status(401)
      })

      it('responds 401 (Unauthorized) when given a wrong password', async () => {
        const response = await request(app).post('/users/auth').send({
          username: 'Bob',
          password: 'a wrong password'
        })
        expect(response).to.have.status(401)
      })

      it('responds with an empty body', async () => {
        const response = await request(app).post('/users/auth').send({
          username: 'Bob',
          password: 'wrong password'
        })
        expect(response.body).to.deep.eql({})
      })

      it('responds 400 (Bad Request) when username is missing', async () => {
        const response = await request(app).post('/users/auth').send({ password: '12345678' })
        expect(response).to.have.status(400)
      })

      it('responds 400 (Bad Request) when password is missing', async () => {
        const response = await request(app).post('/users/auth').send({ username: 'Bob' })
        expect(response).to.have.status(400)
      })
    })
  })

  describe('GET /users', () => {
    it('is unsupported and returns 405 (Method Not Allowed)', async () => {
      const response = await request(app).get('/users')
      expect(response).to.have.status(405)
    })
  })

  describe('GET /users/:userId', () => {
    let givenUser, givenUser2

    before(async () => {
      givenUser = await User.create({
        username: 'Bob',
        password: '12345678'
      })
      givenUser2 = await User.create({
        username: 'Bobby',
        password: 'abcdefgh'
      })
    })

    after(async () => {
      await User.truncate()
    })

    context('on happy path', () => {
      it('respond with status 200 (OK)', async () => {
        const response = await request(app).get(`/users/${givenUser.id}`)
          .set('Authorization', hmac(`GET\n/users/${givenUser.id}\n${JSON.stringify({})}`, givenUser.secret, 'base64'))
        expect(response).to.have.status(200)
      })

      it('sends the user id and username as json', async () => {
        const response = await request(app).get(`/users/${givenUser.id}`)
          .set('Authorization', hmac(`GET\n/users/${givenUser.id}\n${JSON.stringify({})}`, givenUser.secret, 'base64'))
        expect(response.body).to.deep.eql({
          id: givenUser.id,
          username: givenUser.username
        })
      })

      it('requires authentication', async () => {
        const response = await request(app).get(`/users/${givenUser.id}`)
        expect(response).to.have.status(401)
      })
    })

    context('on sad path', () => {
      it('returns status 401 (Unauthorized) when user does not exists (no 404)', async () => {
        const badId = givenUser2.id + 1
        const response = await request(app).get(`/users/${badId}`)
          .set('Authorization', hmac(`GET\n/users/${badId}\n${JSON.stringify({})}`, givenUser.secret, 'base64'))
        expect(response).to.have.status(401)
      })

      it('returns status 401 (Unauthorized) when asking for another user', async () => {
        const response = await request(app).get(`/users/${givenUser.id}`)
          .set('Authorization', hmac(`GET\n/users/${givenUser.id}\n${JSON.stringify({})}`, givenUser2.secret, 'base64'))
        expect(response).to.have.status(401)
      })
    })
  })

  describe('DELETE /user/:userId', () => {

    context('on happy path', () => {
      let givenUser

      beforeEach(async () => {
        givenUser = await User.create({
          username: 'Bob',
          password: '12345678'
        })
      })

      afterEach(async () => {
        await User.truncate()
      })

      it('responds with status 200 (OK)', async () => {
        const response = await request(app).delete(`/users/${givenUser.id}`)
          .set('Authorization', hmac(`DELETE\n/users/${givenUser.id}\n${JSON.stringify({})}`, givenUser.secret, 'base64'))
        expect(response).to.have.status(200)
      })

      it('deletes the user', () => {
        const req = () => request(app).delete(`/users/${givenUser.id}`)
          .set('Authorization', hmac(`DELETE\n/users/${givenUser.id}\n${JSON.stringify({})}`, givenUser.secret, 'base64'))
        return expect(req).to.alter(() => User.count(), { by: -1 })
      })

      it('requires authentication', async () => {
        const response = await request(app).delete(`/users/${givenUser.id}`)
        expect(response).to.have.status(401)
      })
      // TODO: ask for the password for security
    })

    context('on sad path', () => {
      let givenUser, givenUser2

      beforeEach(async () => {
        givenUser = await User.create({
          username: 'Bob',
          password: '12345678'
        })
        givenUser2 = await User.create({
          username: 'Bobby',
          password: 'abcdefgh'
        })
      })

      afterEach(async () => {
        await User.truncate()
      })

      it('returns status 401 (Unauthorized) when trying to delete another user', async () => {
        const deleter = givenUser
        const deletee = givenUser2
        const response = await request(app).delete(`/users/${deletee.id}`)
          .set('Authorization', hmac(`DELETE\n/users/${deletee.id}\n${JSON.stringify({})}`, deleter.secret, 'base64'))
        expect(response).to.have.status(401)
      })

      it('does not delete other users', () => {
        const deleter = givenUser
        const deletee = givenUser2
        const req = () => request(app).delete(`/users/${deletee.id}`)
          .set('Authorization', hmac(`DELETE\n/users/${deletee.id}\n${JSON.stringify({})}`, deleter.secret, 'base64'))
        return expect(req).to.alter(() => User.count(), { by:  0 })
      })

      it('returns status 401 (Unauthorized) when trying to delete a non-existent user', async () => {
        const nonExistentId = givenUser2.id + 1
        const existentSecret = givenUser2.secret
        const response = await request(app).delete(`/users/${nonExistentId}`)
          .set('Authorization', hmac(`DELETE\n/users/${nonExistentId}\n${JSON.stringify({})}`, existentSecret, 'base64'))
        expect(response).to.have.status(401)
      })

      it('does not delete a random user when trying to delete a non-existent user', () => {
        const nonExistentId = givenUser2.id + 1
        const existentSecret = givenUser2.secret
        const req = () => request(app).delete(`/users/${nonExistentId}`)
        .set('Authorization', hmac(`DELETE\n/users/${nonExistentId}\n${JSON.stringify({})}`, existentSecret, 'base64'))
        return expect(req).to.alter(() => User.count(), { by:  0 })
      })
    })
  })

  describe('PATCH users/:userId', pending)
})

// TODO: test routes when database is unreachable, it should return a nice descriptive 500 Internal Server Error
// TODO: use spies/stubs/mocks/whatever to test if authMiddleware is called and other stuff.
// TODO: an helper to sign requests
