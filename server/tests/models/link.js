const { Link, User } = require('../../models')

describe('Link', () => {

  describe('attributes', () => {
    it('has an owner', () => {
      expect(Link.attributes).to.have.own.property('userId')
    })

    it('has an url', () => {
      expect(Link.attributes).to.have.own.property('url')
    })

    it('has a note', () => {
      expect(Link.attributes).to.have.own.property('note')
    })

    it('has a title', () => {
      expect(Link.attributes).to.have.own.property('title')
    })

    it('has a date (createdAt)', () => {
      expect(Link.attributes).to.have.own.property('createdAt')
    })
  })

  describe('association', () => {
    afterEach(async () => {
      await Link.truncate({ cascade: true })
      await User.truncate({ cascade: true })
    })

    it('belongs to user', () => {
      expect(Link.associations).to.nested.include({
        'owner.source.name': 'Link',
        'owner.target.name': 'User',
        'owner.associationType': 'BelongsTo',
        'owner.foreignKey': 'userId',
        'owner.as': 'owner'
      })
    })

    it('can access its owner', async () => {
      const owner = await User.create({ username: 'Bob', password: '12345678' })
      const link = await owner.createLink({ url: 'http://example.com/' })
      expect(await link.getOwner()).to.nested.include({
        'id': owner.id,
        'username': owner.username,
        'password': owner.password
      })
    })

    it('can be accessed by its owner', async () => {
      const owner = await User.create({ username: 'Bob', password: '12345678' })
      const link0 = await owner.createLink({ url: 'http://example.com/0' })
      const link1 = await owner.createLink({ url: 'http://example.com/1' })
      const ownersLinks = await owner.getLinks()
      expect({ 0: ownersLinks[0], 1: ownersLinks[1] }).to.nested.include({
        '0.id': link0.id,
        '0.url': link0.url,
        '0.title': link0.title || null,
        '0.note': link0.note || null,
        '1.id': link1.id,
        '1.url': link1.url,
        '1.title': link1.title || null,
        '1.note': link1.note || null,
      })
    })

    it('gets updated with its owner (cascade)', async () => {
      const owner = await User.create({ username: 'Bob', password: '12345678' })
      const link = await owner.createLink({ url: 'http://example.com/' })
      const newId = owner.id + 1
      await User.update({ id: newId }, { where: { id: owner.id } })
      await link.reload()
      expect(link.userId).to.be.eql(newId)
    })

    it('gets deleted with its owner (cascade)', async () => {
      const owner = await User.create({ username: 'Bob', password: '12345678' })
      await owner.createLink({ url: 'http://example.com/0' })
      await owner.createLink({ url: 'http://example.com/1' })
      await owner.destroy()
      expect(await Link.count()).to.be.eql(0)
    })

    it('does not delete its owner when deleted', async () => {
      const owner = await User.create({ username: 'Bob', password: '12345678' })
      const link = await owner.createLink({ url: 'http://example.com/' })
      await link.destroy()
      expect(await User.count()).to.be.eql(1)
    })
  })

  describe('validation', () => {
    context('on happy path', () => {
      let givenUser

      before(async () => {
        givenUser = await User.create({
          username: 'Bob',
          password: '12345678'
        })
      })

      after(async () => {
        await Link.truncate({ cascade: true })
        await User.truncate({ cascade: true })
      })

      it('is valid', () => {
        const validLink = Link.build({
          url: 'http://example.com',
          note: 'blabla bla\nbla bla.',
          title: 'a title'
        })
        return expect(validLink.validate()).to.be.fulfilled
      })

      it('can be persisted to the database', () => {
        return expect(() => {
          return givenUser.createLink({ url: 'http://example.com' })
        }).to.alter(() => Link.count(), { by: 1 })
      })

      it('uniqueness?')

      it('is valid with a null note', () => {
        return expect(async () => {
          return givenUser.createLink({
            url: 'http://example.com',
            note: null,
            title: 'a title'
          })
        }).to.alter(() => Link.count(), { by: 1 })
      })

      it('is valid with an empty note', () => {
        return expect(() => {
          return givenUser.createLink({
            url: 'http://example.com',
            note: '',
            title: 'a title'
          })
        }).to.alter(() => Link.count(), { by: 1 })
      })

      it('is valid with a null title', () => {
        return expect(() => {
          return givenUser.createLink({
            url: 'http://example.com',
            note: 'blabla bla\nbla bla.',
            title: null
          })
        }).to.alter(() => Link.count(), { by: 1 })
      })

      it('is valid with a blank title', () => {
        return expect(() => {
          return givenUser.createLink({
            url: 'http://example.com',
            note: 'blabla bla\nbla bla.',
            title: ''
          })
        }).to.alter(() => Link.count(), { by: 1 })
      })

      // TODO: tester si la date created at est valide ?
    })

    context('on bad path', () => {
      it('is invalid without a url', () => {
        const invalidLink = Link.build({
          url: null,
          note: 'blabla bla\nbla bla.',
          title: 'a title'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid if url is empty', () => {
        const invalidLink = Link.build({
          url: '',
          note: 'blabla bla\nbla bla.',
          title: 'a title'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid if url is not an URL', () => {
        const invalidLink = Link.build({
          url: 'not an url',
          note: 'blabla bla\nbla bla.',
          title: 'a title'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid if the url is too long (> 2048)', () => {
        const invalidLink = Link.build({
          url: 'http://example.com/' + Array(2048).fill('a').join(''),
          note: 'blabla bla\nbla bla.',
          title: 'a title'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid if the title is too long (> 128)', () => {
        const invalidLink = Link.build({
          url: 'http://example.com',
          note: 'blabla bla\nbla bla.',
          title: Array(128 + 1).fill('a').join('')
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })

      it('is invalid if the note is too long (> 512)', () => {
        const invalidLink = Link.build({
          url: 'http://example.com',
          note: Array(512 + 1).fill('a').join(''),
          title: 'a title'
        })
        return expect(invalidLink.validate()).to.not.be.fulfilled
      })
    })
  })

  describe('search feature', pending)
})
