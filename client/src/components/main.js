import m from 'mithril'

export default class MainUI { // TODO: ajouter ouvrir en grand, recherche, etc.
  view() {
    browser.storage.local.clear() // TODO: remove
    return [
      m('h1', [
        'Lisi',
        m('small', ' › Save a link')
      ]),
      m('input[placeholder=tags]'),
      m('textarea[placeholder=notes]'),
      m('button[style=width:50%]', { onclick: () => window.close() }, 'Cancel'),
      m('button[style=width:50%]', { onclick: () => window.close() }, 'Save!'),
    ]
  }
}
