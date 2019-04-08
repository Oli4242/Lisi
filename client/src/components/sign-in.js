import m from 'mithril'
import Authentication from '../models/authentication'

export default class SignInUI {
  oninit() {
    Authentication.load()
    this.password = null
    this.passwordConfirmation = null
    this.isPending = false
  }

  view() {
    return [
      m('h1', [
        'Lisi',
        m('small', ' › Sign in')
      ]),
      Authentication.error && m('pre.errors', Authentication.SignInErrorText),
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
      m('input[type=password][placeholder=repeat password]', {
        oninput: e => this.passwordConfirmation = e.target.value,
        value: this.passwordConfirmation,
        disabled: this.isPending
      }),
      m('input[placeholder=server]', {
        oninput: e => Authentication.server = e.target.value,
        value: Authentication.server,
        disabled: this.isPending
      }),
      m('button[style=width:50%]', {
        onclick: () => this.logInAction()
      }, '‹ Back'),
      m('button[style=width:50%]', {
        onclick: () => this.signInAction(),
        disabled: this.isPending
      }, 'Sign in!'),
    ]
  }

  logInAction() {
    m.route.set('/login')
  }

  async signInAction() {
    this.isPending = true
    m.redraw()

    await Authentication.signIn(this.password, this.passwordConfirmation)
    if (!Authentication.error)
      m.route.set('/login')

    this.isPending = false
    m.redraw()
  }
}
