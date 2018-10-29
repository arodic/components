import {html, IoElement} from "../classes/element.js";
import {ProtoConfig} from "../core/protoConfig.js";

const __configMap = new WeakMap();

export class IoObject extends IoElement {
  static get style() {
    return html`<style>
      :host {
        display: flex;
        flex-direction: column;
        flex: 0 0;
        line-height: 1em;
      }
      :host > div {
        display: flex;
        flex-direction: row;
      }
      :host > div > span {
        padding: 0 0.2em 0 0.5em;
        flex: 0 0 auto;
      }
      :host > div > io-number {
        color: rgb(28, 0, 207);
      }
      :host > div > io-string {
        color: rgb(196, 26, 22);
      }
      :host > div > io-boolean {
        color: rgb(170, 13, 145);
      }
      :host > div > io-option {
        color: rgb(32,135,0);
      }
    </style>`;
  }
  static get properties() {
    return {
      value: Object,
      props: Array,
      config: Object,
      expanded: {
        type: Boolean,
        reflect: true
      },
      label: String
    };
  }
  constructor(props) {
    super(props);
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('io-object-mutated', this._onIoObjectMutated);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('io-object-mutated', this._onIoObjectMutated);
  }
  _onIoObjectMutated(event) {
    let key = event.detail.key;
    if (event.detail.object === this.value) {
      if (key && this.$[key]) {
        this.$[key].__props.value.value = this.value[key];
        this.$[key].changed();
      } else if (!key || key === '*') {
        for (let k in this.$) {
          this.$[k].__props.value.value = this.value[k];
          this.$[k].changed();
        }
      }
    }
  }
  _onValueSet(event) {
    const path = event.composedPath();
    if (path[0] === this) return;
    if (event.detail.object) return; // TODO: unhack
    event.stopPropagation();
    let key = path[0].id;
    if (key !== null) {
      this.value[key] = event.detail.value;
      let detail = Object.assign({object: this.value, key: key}, event.detail);
      this.dispatchEvent('io-object-mutated', detail, false, window);
      this.dispatchEvent('value-set', detail, false); // TODO
    }
  }
  valueChanged() {
    if (__configMap.has(this.value)) {
      this.config = __configMap.get(this.value);
    } else {
      this.config = this.__proto__.__config.getConfig(this.value);
      __configMap.set(this.value, this.config);
    }
  }
  changed() {
    const types = this.config.types;
    const groups = this.config.groups;
    //TODO: implement groups

    let label = this.label || this.value.constructor.name;
    let elements = [['io-boolean', {true: '▾' + label, false: '▸' + label, value: this.bind('expanded')}]];
    if (this.expanded) {
      for (let key in types) {
        if (!this.props.length || this.props.indexOf(key) !== -1) {
          const tag = types[key][0];
          const protoConfig = types[key][1];
          const itemConfig = {id: key, value: this.value[key], 'on-value-set': this._onValueSet};
          elements.push(['div', [['span', types.label || key + ':'], [tag, Object.assign(itemConfig, protoConfig)]]]);
        }
      }
    }
    this.template(elements);
  }
  static get config() {
    return {
      types: {
        'Object': {
          'type:string': ['io-string', {}],
          'type:number': ['io-number', {step: 0.01}],
          'type:boolean': ['io-boolean', {}],
          'type:object': ['io-object', {}],
          'value:null': ['io-string', {}],
          'value:undefined': ['io-string', {}],
        },
      },
      groups: {
        'Object': {
          'properties': ['key:time'],
          'meshes': ['constructor:Mesh'],
          'objects': ['type:object'],
          'truestrings': ['value:true', 'value:false'],
        },
      }
    };
  }
  static get groups() {
    return {
    };
  }
}

IoObject.Register = function() {
  IoElement.Register.call(this);
  Object.defineProperty(this.prototype, '__config', {value: new ProtoConfig(this.prototype.__prototypes)});
};

IoObject.Register();