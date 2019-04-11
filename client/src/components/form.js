import m from 'mithril'

// When Enter is pressed in a form, the first button gets triggered
// This component allows to control this behavior (somewhat) elegantly
// It also adds a ctrl+enter key binding so we can submit from a textarea
export default class Form {
  view(vnode) {
    return m('form', {
      onkeypress: e => {
        if( e.ctrlKey && e.keyCode === 13)
          return vnode.attrs.defaultAction(e)
      }
    }, [
      m('button[style=display:none]', { onclick: vnode.attrs.defaultAction }),
      vnode.children
    ])
  }
}
