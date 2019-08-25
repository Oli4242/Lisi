const app = require('../../app')
const { User, Link } = require('../../models')
const hmac = require('../../utils/hmac')
const authorizationFor = require('../../utils/tests-helpers/authorization-for')

describe('/user/:id/links', () => {

  describe('POST /user/:id/links', () => {
    let givenUser, givenUser2, givenLink

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

    beforeEach(async () => {
      givenLink = await givenUser.createLink({
        url: 'http://example.com/given/link',
        note: 'osef'
      })
    })

    afterEach(async () => {
      await Link.truncate()
    })

    context('on happy path', () => {
      it('returns status 201 (Created)', async () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const response = await request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        expect(response).to.have.status(201)
      })

      it('creates a new link', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 1 })
      })

      it('works without the `note` field (optional)', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: null
        }
        const req = () => request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 1 })
      })

      it('works even when another user already saved the same link', () => {
        const url = `/users/${givenUser2.id}/links`
        const body = {
          url: givenLink.url,
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser2, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 1 })
      })
    })

    context('on sad path', () => {
      it('returns status 401 (Unauthorized) when authenticated as another user', async () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const response = await request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser2, 'POST', url, body))
        expect(response).to.have.status(401)
      })

      it('does not creates a new link when authenticated as another user', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
        .set('Authorization', authorizationFor(givenUser2, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })

      it('returns status 401 (Unauthorized) when the user is not authenticated', async () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const response = await request(app).post(url).send(body)
        expect(response).to.have.status(401)
      })

      it('does not creates a new link when  when the user is not authenticated', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: 'http://example.com/',
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })

      it('returns status 400 (Bad Request) when the url field is missing', async () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: '',
          note: 'a note\nblabla'
        }
        const response = await request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        expect(response).to.have.status(400)
      })

      it('does not creates a new link on 400 (Bad Request) error', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: '',
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })

      it('returns status 409 (Conflict) when the link already exists in database', async () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: givenLink.url,
          note: 'a note\nblabla'
        }
        const response = await request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        expect(response).to.have.status(409)
      })

      it('does not creates a new link on 409 (Conflict) error', () => {
        const url = `/users/${givenUser.id}/links`
        const body = {
          url: givenLink.url,
          note: 'a note\nblabla'
        }
        const req = () => request(app).post(url).send(body)
          .set('Authorization', authorizationFor(givenUser, 'POST', url, body))
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })
    })
  })

  describe('GET /user/:id/links', () => { // TODO: pagination
    let givenUser, givenUser2, givenLinks

    before(async () => {
      givenUser = await User.create({
        username: 'Bob',
        password: '12345678'
      })
      givenUser2 = await User.create({
        username: 'Bobby',
        password: 'abcdefgh'
      })
      givenLinks = await Link.bulkCreate([
        { userId: givenUser.id, url: 'http://example.com/0', note: 'note 0', title: 'title 0' },
        { userId: givenUser.id, url: 'http://example.com/1', note: 'note 1', title: 'title 1' },
        { userId: givenUser.id, url: 'http://example.com/2', note: 'note 2', title: 'title 2' },
      ])
    })

    after(async () => {
      await User.truncate()
      await Link.truncate()
    })

    context('on happy path',() => {
      it('returns status 200 (OK)',  async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        expect(response).to.have.status(200)
      })

      it('returns the all the links as json', async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        const expectedBody = {
          links: givenLinks.map(link => ({
              id: link.id,
              url: link.url,
              note: link.note,
              title: link.title
          }))
        }
        expect(response.body).to.deep.eql(expectedBody)
      })

      it('works even when the list is empty', async () => {
        const url = `/users/${givenUser2.id}/links`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response.body).to.deep.eql({ links: [] })
      })
    })

    context('on sad path', () => {
      it('requires authentication', async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
        expect(response).to.have.status(401)
      })

      it('returns empty body on error 401 (Unauthorized)', async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
        expect(response.body).to.eql({})
      })

      it('disallows access from other users', async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
        .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response.body).to.eql({})
      })

      it('returns error 401 (Unauthorized) to other users', async () => {
        const url = `/users/${givenUser.id}/links`
        const response = await request(app).get(url)
        .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response).to.have.status(401)
      })
    })
  })

  describe('GET /users/:id/links/:id', () => {
    let givenUser, givenUser2, givenLink

    before(async () => {
      givenUser = await User.create({
        username: 'Bob',
        password: '12345678'
      })
      givenUser2 = await User.create({
        username: 'Bobby',
        password: 'abcdefgh'
      })
      givenLink = await givenUser.createLink({
        url: 'http://example.com/given/link',
        title: 'a title',
        note: 'a note'
      })
    })

    after(async () => {
      await User.truncate()
      await Link.truncate()
    })

    context('on happy path', () => {
      it('returns status 200 (OK)', async() => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        expect(response).to.have.status(200)
      })

      it('returns the desired link as json', async () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        expect(response.body).to.deep.eql({ // TODO: add date and maybe userId/owner ?
          id: givenLink.id,
          url: givenLink.url,
          note: givenLink.note,
          title: givenLink.title,
        })
      })
    })

    context('on sad path', () => {
      it('returns status 404 (Not Found) when the link does not exist', async () => {
        const nonExistingLinkId = givenLink.id + 1
        const url = `/users/${givenUser.id}/links/${nonExistingLinkId}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        expect(response).to.have.status(404)
      })

      it('answers with an empty response on error 404 (Not Found)', async () => {
        const nonExistingLinkId = givenLink.id + 1
        const url = `/users/${givenUser.id}/links/${nonExistingLinkId}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser, 'GET', url))
        expect(response.body).to.eql({})
      })

      it('returns status 401 (Unauthorized) when trying to access another userId', async () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response).to.have.status(401)
      })

      it('returns status 401 (Unauthorized) when trying to access another userId even if the linkId does not exist', async () => {
        const nonExistingLinkId = givenLink.id + 1
        const url = `/users/${givenUser.id}/links/${nonExistingLinkId}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response).to.have.status(401)
      })

      it('returns status 404 (Not Found) when trying to access a linkId owned by someone else', async () => { // It must give no information about other user's links
        const url = `/users/${givenUser2.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response).to.have.status(404)
      })

      it('answers with an empty response on error 401 (Unauthorized)', async () => {
        const url = `/users/${givenUser2.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
          .set('Authorization', authorizationFor(givenUser2, 'GET', url))
        expect(response.body).to.eql({})
      })

      it('requires authentication', async () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).get(url)
        expect(response).to.have.status(401)
      })
    })
  })

  describe('PATCH /users/:id/links/:id', () => { // TODO:
    context('on happy path', pending)
    context('on sad path', pending)
  })

  describe('DELETE /users/:id/links/:id', () => {
    let givenUser, givenUser2, givenLink

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

    beforeEach(async () => {
      givenLink = await givenUser.createLink({
        url: 'http://example.com/given/link',
        title: 'a title',
        note: 'a note'
      })
    })

    afterEach(async () => {
      await Link.truncate()
    })

    context('on happy path', () => {
      it('returns status 200 (OK)', async () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser, 'DELETE', url))
        expect(response).to.have.status(200)
      })

      it('deletes the link', () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const req = () => request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser, 'DELETE', url))
        return expect(req).to.alter(() => Link.count(), { by: -1 })
      })
    })

    context('on sad path', () => {
      it('returns status 404 (Not Found) when the link does not exists', async () => {
        const nonExistingLinkId = givenLink.id + 1
        const url = `/users/${givenUser.id}/links/${nonExistingLinkId}`
        const response = await request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser, 'DELETE', url))
        expect(response).to.have.status(404)
      })

      it('returns status 404 (Not Found) when the link exists but is owned by someone else', async () => {
        const url = `/users/${givenUser2.id}/links/${givenLink.id}`
        const response = await request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser2, 'DELETE', url))
        expect(response).to.have.status(404)
      })

      it('deletes nothing on 404 (Not Found) error', () => {
        const url = `/users/${givenUser2.id}/links/${givenLink.id}`
        const req = () => request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser2, 'DELETE', url))
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })

      it('returns status 401 (Unauthorized) when trying to delete someone else\'s link', async () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const response = await request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser2, 'DELETE', url))
        expect(response).to.have.status(401)
      })

      it('does not delete other\'s links', () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const req = () => request(app).delete(url)
          .set('Authorization', authorizationFor(givenUser2, 'DELETE', url))
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })

      it('requires authentication', () => {
        const url = `/users/${givenUser.id}/links/${givenLink.id}`
        const req = () => request(app).delete(url)
        return expect(req).to.alter(() => Link.count(), { by: 0 })
      })
    })
  })

  // TODO: search links by url/name/note/title/date
  // TODO: count
})
