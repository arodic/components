import {IoBase, html} from "./io-base.js"

export class IoFunction extends IoBase {
  static get is() { return 'io-function'; }
  static get template() {
    return html`
      <style>
        :host {
          cursor: pointer;
          display: inline-block;
          font-style: italic;
        }
      </style><slot>undefined</slot>
    `;
  }
  static get properties() {
    return {
      value: {
        observer: '_updateJob'
      }
    }
  }
  _update() {
    // https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var ARGUMENT_NAMES = /([^\s,]+)/g;
    var fnStr = this.value.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES) || [];
    this.innerText = 'ƒ(' + result + ')';
  }
}

window.customElements.define(IoFunction.is, IoFunction);
