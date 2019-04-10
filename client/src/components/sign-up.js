import m from 'mithril'
import Authentication from '../models/authentication'

export default class SignUpUI {
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
        m('small', ' › Sign up')
      ]),
      Authentication.error && m('pre.errors', Authentication.SignUpErrorText),
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
        onclick: () => this.signUpAction(),
        disabled: this.isPending
      }, 'Sign up!'),
    ]
  }

  logInAction() {
    m.route.set('/log-in')
  }

  async signUpAction() {
    this.isPending = true
    m.redraw()

    await Authentication.signUp(this.password, this.passwordConfirmation)
    if (!Authentication.error)
      m.route.set('/log-in')

    this.isPending = false
    m.redraw()
  }
}
