import {IoButton} from "./button.js";

export class IoOption extends IoButton {
  static get properties() {
    return {
      value: null,
      action: Function,
      options: Array
    };
  }
  _onAction(event) {
    if (event.which == 13 || event.which == 32 || event.type == 'mouseup' || event.type == 'touchend') {
      event.preventDefault();
    }
  }
  _onUp(event) {
    super._onUp(event);
    this.$['menu'].expanded = true;
    let firstItem = this.$['menu'].$['group'].querySelector('io-menu-item');
    if (firstItem) firstItem.focus();
  }
  _onMenu(event) {
    this.$['menu'].expanded = false;
    this.set('value', event.detail.value);
    if (typeof this.action === 'function') {
      this.action(this.value);
    }
  }
  update() {
    let label = this.value;
    if (label instanceof Object) label = label.__proto__.constructor.name;
    if (this.options) {
      for (let i = 0; i < this.options.length; i++) {
        if (this.options[i].value == this.value) {
          label = this.options[i].label || label;
          break;
        }
      }
    }
    if (typeof label === 'number') label = label.toFixed(-Math.round(Math.log(0.001) / Math.LN10));
    this.__props.label.value = label;
    this.render([
      ['span', String(label)],
      ['io-menu', {
        id: 'menu',
        options: this.options,
        position: 'bottom',
        listener: 'click',
        'on-io-menu-item-clicked': this._onMenu}]
    ]);
  }
}

IoOption.Register();
