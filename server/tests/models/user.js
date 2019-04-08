const { User, Link } = require('../../models')
const { randomBytes } = require('crypto')
const isBcrypt = require('is-bcrypt')

describe('User', () => {

  describe('attributes', () => {
    it('has a username', () => {
      expect(User.attributes).to.have.own.property('username')
    })

    it('has a password', () => {
      expect(User.attributes).to.have.own.property('password')
    })

    it('has a secret', () => {
      expect(User.attributes).to.have.own.property('secret')
    })

    it('has a date (createdAt)', () => {
      expect(User.attributes).to.have.own.property('createdAt')
    })
  })

  describe('association', () => {
    it('has many links', () => {
      expect(User.associations).to.nested.include({
        'links.source': User,
        'links.target': Link,
        'links.associationType': 'HasMany',
        'links.foreignKey': 'userId',
        'links.as': 'links'
      })
    })
  })

  describe('validation', () => {
    context('on happy path', () => {
      after(() => {
        return User.truncate({ cascade: true })
      })

      it('is valid', () => {
        const validUser = User.build({
          username: 'Bob',
          password: '12345678'
        })
        return expect(validUser.validate()).to.be.fulfilled
      })

      it('can be persisted to the database', () => {
        return expect(async () => {
          await User.create({
            username: 'Bob',
            password: '12345678'
          })
        }).to.alter(() => User.count(), { by: 1 })
      })

      it('generates a secret on validation (beforeValidate hook)', async () => {
        const user = await User.build({
          username: 'Bob',
          password: '12345678'
        })
        await user.validate()
        expect(user.secret).to.be.a('string')
      })

      it('bcrypts the password on validation (afterValidate hook)', async () => {
        const user = await User.build({
          username: 'Bob',
          password: '12345678'
        })
        await user.validate()
        expect(user.password).to.satisfy(isBcrypt)
      })
    }) // TODO: tester si settings.json est bel et bien utilisé

    context('on bad path', () => {
      after(() => {
        return User.truncate({ cascade: true })
      })

      it('is invalid without a username', () => {
        const invalidLink = User.build({
          username: null,
          password: '12345678'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid with a blank username', () => {
        const invalidLink = User.build({
          username: '',
          password: '12345678'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('as a unique username', async () => {
        await User.create({
          username: 'Bobby',
          password: '12346578'
        })
        return expect(User.create({
          username: 'Bobby',
          password: 'abcdefgh'
        })).to.not.be.fulfilled
      })

      it('is invalid when username is too short (<3)', () => {
        const invalidLink = User.build({
          username: 'aa',
          password: '12345678'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid when the username is too long (> 32)', () => {
        const invalidLink = User.build({
          username: Array(32 + 1).fill('a').join(''),
          password: '12345678'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid without a password', () => {
        const invalidLink = User.build({
          username: 'Bob',
          password: null

        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid when password is blank', () => {
        const invalidLink = User.build({
          username: 'Bob',
          password: ''
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid when secret < 64', () => {
        const invalidLink = User.build({
          username: 'Bob',
          password: '12345678',
          secret: Array(64 - 1).fill('x').join('')
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid when secret > 128', () => {
        const invalidLink = User.build({
          username: 'Bob',
          password: '12345678',
          secret: Array(128 + 1).fill('x').join('')
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })
    })
  })
})
