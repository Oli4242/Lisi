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
      // m('button[style=font-size:0.7rem;width:10%;position:absolute;top:0.5rem;right:0.3rem;]', '☰'),
      // m('button[style=font-size:1rem;width:10%;position:absolute;top:0.5rem;right:0.3rem;]', '⚙'),
      // TODO: qu'on puisse appuyer sur entrer pour valider (farie un form)
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

  async logInAction() { // TODO: redirect to log-in on success
    this.isPending = true
    m.redraw()

    await Authentication.logIn(this.password)
    if (!Authentication.error)
      window.close()

    this.isPending = false
    m.redraw()
  }
}

// TODO: feedback -> loading + success/error messages
// TODO: client-side validation
