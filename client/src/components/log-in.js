import m from 'mithril'
import httpStatus from 'http-status'
import Authentication from '../models/authentication'
import Form from './form'

export default class LogInUI {
  oninit() {
    Authentication.load()
    Authentication.error = null
    this.password = null
    this.isPending = false
  }

  view() {
    return [
      m('h1', [
        'Lisi',
        m('small', ' › Log in')
      ]),
      m(Form, {
        defaultAction: () => this.logInAction()
      }, [
        Authentication.error && m('pre.errors', Authentication.logInErrorText),
        m('input[placeholder=username]', { // TODO: write an helper or a component to dry this
          oninput: e => Authentication.username = e.target.value,
          value: Authentication.username,
          disabled: this.isPending
        }),
        m('input[type=password][placeholder=password]', {
          oninput: e => this.password = e.target.value,
          value: this.password,
          disabled: this.isPending
        }),
        m('input[placeholder=server]', {
          oninput: e => Authentication.server = e.target.value,
          value: Authentication.server,
          disabled: this.isPending
        }),
        m('button[style=width:50%]', {
          onclick: () => this.signUpAction()
        }, 'Sign up'),
        m('button[style=width:50%]', {
          disabled: this.isPending,
          onclick: () => this.logInAction()
        }, 'Log in!'),
      ])
    ]
  }

  signUpAction() {
    m.route.set('/sign-up')
  }

  async logInAction() {
    this.isPending = true
    m.redraw()

    await Authentication.logIn(this.password)
    if (!Authentication.error)
      window.close()

    this.isPending = false
    m.redraw()
  }
}
