class Prototypes extends Array {
  constructor(_constructor) {
    super();
    let proto = _constructor.prototype;
    while (proto && proto.constructor !== HTMLElement && proto.constructor !== Object) {
      this.push(proto);
      proto = proto.__proto__;
    }
  }
}

class ProtoProperties {
  constructor(prototypes) {
    const propertyDefs = {};
    for (let i = prototypes.length; i--;) {
      let prop = prototypes[i].constructor.properties;
      for (let key in prop) {
        let propDef = new Property(prop[key], true);
        if (propertyDefs[key]) propertyDefs[key].assign(propDef);
        else propertyDefs[key] = propDef;
      }
    }
    for (let key in propertyDefs) {
      this[key] = new Property(propertyDefs[key]);
    }
  }
  clone() {
    let properties = {};
    for (let prop in this) {
      properties[prop] = this[prop].clone();
    }
    return properties;
  }
}

class Property {
  constructor(propDef) {
    if (propDef === null || propDef === undefined) {
      propDef = {};
    } else if (typeof propDef === 'function') {
      propDef = {type: propDef};
    } else if (typeof propDef !== 'object') {
      propDef = {value: propDef, type: propDef.constructor};
    }
    if (!propDef.value && propDef.type && propDef.type !== HTMLElement) propDef.value = new propDef.type();
    this.value = propDef.value;
    this.type = propDef.type;
    this.observer = propDef.observer;
    this.notify = propDef.notify || false;
    this.reflect = propDef.reflect;
    this.binding = propDef.binding;
    this.config = propDef.config;
  }
  assign(propDef) {
    if (propDef.value !== undefined) this.value = propDef.value;
    if (propDef.type !== undefined) this.type = propDef.type;
    if (propDef.observer !== undefined) this.observer = propDef.observer;
    if (propDef.notify !== undefined) this.notify = propDef.notify;
    if (propDef.reflect !== undefined) this.reflect = propDef.reflect;
    if (propDef.binding !== undefined) this.binding = propDef.binding;
    if (propDef.config !== undefined) this.config = propDef.config;
  }
  clone() {
    let prop = new Property(this);
    if (prop.value && typeof prop.value.clone === 'function') {
      prop.value = prop.value.clone();
    } else if (prop.value instanceof Array) {
      prop.value = [ ...prop.value ];
    } else if (prop.value instanceof Object) {
      let value = prop.value;
      prop.value = {};
      for (let prop in value) {
        prop.value[prop] = value[prop];
      }
    }
    return prop;
  }
}

class ProtoListeners {
  constructor(prototypes) {
    for (let i = prototypes.length; i--;) {
      let prop = prototypes[i].constructor.listeners;
      for (let key in prop) this[key] = prop[key];
    }
  }
  connect(element) {
    for (let i in this) {
      element.addEventListener(i, element[this[i]]);
    }
  }
  disconnect(element) {
    for (let i in this) {
      element.removeEventListener(i, element[this[i]]);
    }
  }
}

class ProtoFunctions extends Array {
  constructor(prototypes) {
    super();
    for (let i = prototypes.length; i--;) {
      let names = Object.getOwnPropertyNames(prototypes[i]);
      for (let j = 0; j < names.length; j++) {
        if (names[j] === 'constructor') continue;
        if (typeof prototypes[i][names[j]] !== 'function') continue;
        this.push(names[j]);
      }
    }
  }
  bind(element) {
    for (let i = 0; i < this.length; i++) {
      element[this[i]] = element[this[i]].bind(element);
    }
  }
}

const _stagingElement = document.createElement('div');

function initStyle(prototypes) {
  let localName = prototypes[0].constructor.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  for (let i = prototypes.length; i--;) {
    let style = prototypes[i].constructor.style;
    if (style) {
      if (i < prototypes.length - 1 && style == prototypes[i + 1].constructor.style) continue;
      style = style.replace(new RegExp(':host', 'g'), localName);
      _stagingElement.innerHTML = style;
      let element = _stagingElement.querySelector('style');
      element.setAttribute('id', 'io-style-' + localName + '-' + i);
      document.head.appendChild(element);
    }
  }
}

class Binding {
  constructor(source, sourceProp) {
    this.source = source;
    this.sourceProp = sourceProp;
    this.targets = [];
    this.targetsMap = new WeakMap();
    this.updateSource = this.updateSource.bind(this);
    this.updateTargets = this.updateTargets.bind(this);
    this.setSource(this.source);
  }
  setSource() {
    this.source.__props[this.sourceProp].notify = true;
    this.source.addEventListener(this.sourceProp + '-changed', this.updateTargets);
    for (let i = this.targets.length; i--;) {
      let targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        this.targets[i].__props[targetProps[j]].value = this.source[this.sourceProp];
        // TODO: test observers on binding hot-swap!
      }
    }
  }
  setTarget(target, targetProp) {
    target.__props[targetProp].notify = true;
    if (this.targets.indexOf(target) === -1) this.targets.push(target);
    if (this.targetsMap.has(target)) {
      let targetProps = this.targetsMap.get(target);
      if (targetProps.indexOf(targetProp) === -1) { // safe check needed?
        targetProps.push(targetProp);
        target.addEventListener(targetProp + '-changed', this.updateSource);
      }
    } else {
      this.targetsMap.set(target, [targetProp]);
      target.addEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  removeTarget(target, targetProp) {
    if (this.targetsMap.has(target)) {
      let targetProps = this.targetsMap.get(target);
      let index = targetProps.indexOf(targetProp);
      if (index !== -1) {
        targetProps.splice(index, 1);
      }
      // TODO: remove from WeakMap?
      target.removeEventListener(targetProp + '-changed', this.updateSource);
    }
  }
  updateSource(event) {
    if (this.targets.indexOf(event.srcElement) === -1) return;
    if (this.source[this.sourceProp] !== event.detail.value) {
      this.source[this.sourceProp] = event.detail.value;
    }
  }
  updateTargets(event) {
    if (event.srcElement != this.source) return;
    for (let i = this.targets.length; i--;) {
      let targetProps = this.targetsMap.get(this.targets[i]);
      for (let j = targetProps.length; j--;) {
        if (this.targets[i][targetProps[j]] !== event.detail.value) {
          this.targets[i][targetProps[j]] = event.detail.value;
        }
      }
    }
  }
}

class Node {
  constructor(props = {}, element) {
    Object.defineProperty(this, 'element', { value: element });

    this.properties = {};
    this.bindings = {};
    this.listeners = {};

    Object.defineProperty(this, '_connected', { value: false, writable: true });
    Object.defineProperty(this, '_connectedListeners', { value: {} });
    Object.defineProperty(this, '_boundProperties', { value: {} });
    Object.defineProperty(this, '_srcBindings', { value: {} });
    Object.defineProperty(this, '_triggeredObservers', { value: [] });

    this.update(props);
  }
  update(props) {

    this.properties = {};
    this.bindings = {};
    this.listeners = {};

    for (let p in props) {
      if (this.element.__props[p] === undefined) continue;
      if (props[p] instanceof Binding) {
        this.bindings[p] = props[p];
        this.properties[p] = props[p].source[props[p].sourceProp];
      } else {
        this.properties[p] = props[p];
      }
    }
    for (let l in props['listeners']) {
      this.listeners[l] = props['listeners'][l];
    }

    if (props['className']) {
      this.element.className = props['className'];
    }

    // TODO: use attributeStyleMap when implemented in browser
    // https://developers.google.com/web/updates/2018/03/cssom
    if (props['style']) {
      for (let s in props['style']) {
        this.element.style[s] = props['style'][s];
      }
    }

    this.setProperties();
    // TODO: untangle this mess
    if (this._connected)  {
      this.connectListeners();
      this.triggerObservers();
      this.connectBindings();
    }
  }
  connect() {
    if (!this._connected) {
      this.connectListeners();
      this.connectBindings();
      this.triggerObservers();
    }
    this._connected = true;
  }
  disconnect() {
    if (this._connected) {
      this.disconnectListeners();
      this.disconnectBindings();
    }
    this._connected = false;
  }
  connectListeners() {
    // TODO: test
    for (let l in this.listeners) {
      if (!this._connectedListeners[l]) {
        this.element.addEventListener(l, this.listeners[l]);
      } else if (this._connectedListeners[l] !== this.listeners[l]) {
        this.element.removeEventListener(l, this._connectedListeners[l]);
        this.element.addEventListener(l, this.listeners[l]);
      }
      this._connectedListeners[l] = this.listeners[l];
    }
    for (let l in this._connectedListeners) {
      if (this.listeners[l] === undefined) {
        this.element.removeEventListener(l, this._connectedListeners[l]);
        delete this._connectedListeners[l];
      }
    }
  }
  disconnectListeners() {
    for (let l in this.listeners) {
      this.element.removeEventListener(l, this.element[this.listeners[l]]);
      delete this._connectedListeners[l];
    }
  }
  setProperties() {
    this._triggeredObservers.length = 0;
    this._triggeredObservers.push('update');

    for (let p in this.properties) {

      let value = this.properties[p];
      let oldValue = this.element.__props[p].value;

      this.element.__props[p].value = value;

      if (value !== oldValue) {
        if (this.element.__props[p].reflect) {
          this.element.reflectAttribute(p);
        }
        if (this.element.__props[p].observer) {
          if (this._triggeredObservers.indexOf(this.element.__props[p].observer) === -1) {
            this._triggeredObservers.push(this.element.__props[p].observer);
          }
        }
      }
    }
  }
  triggerObservers() {
    // TODO: test
    for (let j = 0; j < this._triggeredObservers.length; j++) {
      this.element[this._triggeredObservers[j]]();
    }
    this._triggeredObservers.length = 0;
  }
  connectBindings() {
    for (let b in this.bindings) {
      let binding = this.bindings[b];
      if (this._boundProperties[b] !== binding) {
        this.bindings[b].setTarget(this.element, b);
        this._boundProperties[b] = binding;
      }
    }
    for (let b in this._boundProperties) {
      if (this.bindings[b] === undefined) {
        this._boundProperties[b].removeTarget(this.element, b);
        delete this._boundProperties[b];
      }
    }
  }
  disconnectBindings() {
    for (let b in this._boundProperties) {
      this._boundProperties[b].removeTarget(this.element, b);
      delete this._boundProperties[b];
    }
  }
  bind(prop) {
    this._srcBindings[prop] = this._srcBindings[prop] || new Binding(this.element, prop);
    return this._srcBindings[prop];
  }
}

const renderNode = function(vDOMNode) {
  let ConstructorClass = customElements.get(vDOMNode.name);
  let element;
  if (ConstructorClass) {
    element = new ConstructorClass(vDOMNode.props);
  } else {
    element = document.createElement(vDOMNode.name);
    updateNode(element, vDOMNode);
  }
  return element;
};

const updateNode = function(element, vDOMNode) {
  for (let prop in vDOMNode.props) {
    element[prop] = vDOMNode.props[prop];
  }
  // TODO: handle special cases cleaner
  // TODO: use attributeStyleMap when implemented in browser
  // https://developers.google.com/web/updates/2018/03/cssom
  if (vDOMNode.props['style']) {
    for (let s in vDOMNode.props['style']) {
      element['style'][s] = vDOMNode.props['style'][s];
    }
  }
  return element;
};

// https://github.com/lukejacksonn/ijk
const clense = (a, b) => !b ? a : typeof b[0] === 'string' ? [...a, b] : [...a, ...b];
// TODO: understand!
const buildTree = () => node => !!node && typeof node[1] === 'object' && !Array.isArray(node[1]) ? {
    ['name']: node[0],
    ['props']: node[1],
    ['children']: Array.isArray(node[2]) ? node[2].reduce(clense, []).map(buildTree()) : node[2] || ''
  } : buildTree()([node[0], {}, node[1] || '']);

function html() { return arguments[0][0]; }

class IoElement extends HTMLElement {
  static get properties() {
    return {
      id: String,
      tabindex: {
        type: String,
        reflect: true
      },
      contenteditable: {
        type: Boolean,
        reflect: true
      }
    };
  }
  constructor(initProps) {
    super();

    Object.defineProperty(this, '__props', { value: this.__proto__._properties.clone() } );
    Object.defineProperty(this, '__node', { value: new Node(initProps, this) } );
    Object.defineProperty(this, '$', { value: {} } ); // TODO: consider clearing on update

    this.__proto__._functions.bind(this);

    for (let prop in this.__props) {
      this.defineProperty(prop);
      this.reflectAttribute(prop);
    }
  }
  connectedCallback() {
    this.__proto__._listeners.connect(this);
    this.__node.connect();
  }
  disconnectedCallback() {
    this.__proto__._listeners.disconnect(this);
    this.__node.disconnect();
  }
  defineProperty(prop) {
    if (this.__proto__.hasOwnProperty(prop)) return;
    Object.defineProperty(this.__proto__, prop, {
      get: function() {
        return this.__props[prop].value;
      },
      set: function(value) {
        if (this.__props[prop].value === value) return;
        let oldValue = this.__props[prop].value;
        this.__props[prop].value = value;
        this.reflectAttribute(prop);
        if (this.__props[prop].observer) {
          this[this.__props[prop].observer](value, oldValue, prop);
        }
        this.update();
        if (this.__props[prop].notify) {
          this.dispatchEvent(prop + '-changed', {value: value, oldValue: oldValue}, false);
        }
      },
      enumerable: true,
      configurable: true
    });
  }
  initAttribute(attr, value) {
    if (value === true) {
      this.setAttribute(attr, '');
    } else if (value === false || value === '') {
      this.removeAttribute(attr);
    } else if (typeof value == 'string' || typeof value == 'number') {
      this.setAttribute(attr, value);
    }
  }
  reflectAttribute(prop) {
    const config = this.__props[prop];
    if (config.reflect) {
      this.initAttribute(prop, config.value);
    }
  }
  render(children, host) {
    this.traverse(buildTree()(['root', children]).children, host || this);
  }
  traverse(vChildren, host) {
    const children = host.children;
    // remove trailing elements
    while (children.length > vChildren.length) host.removeChild(children[children.length - 1]);

    // create new elements after existing
    const frag = document.createDocumentFragment();
    for (let i = children.length; i < vChildren.length; i++) {
      frag.appendChild(renderNode(vChildren[i]));
    }
    host.appendChild(frag);

    for (let i = 0; i < children.length; i++) {

      // replace existing elements
      if (children[i].localName !== vChildren[i].name) {
        const oldElement = children[i];
        host.insertBefore(renderNode(vChildren[i]), oldElement);
        host.removeChild(oldElement);

      // update existing elements
      } else {
        // Io Elements
        if (children[i].hasOwnProperty('__node')) {
          children[i].__node.update(vChildren[i].props); // TODO: test
        // Native HTML Elements
        } else {
          updateNode(children[i], vChildren[i]);
        }
      }
    }

    for (let i = 0; i < vChildren.length; i++) {
      if (vChildren[i].props.id) {
        this.$[vChildren[i].props.id] = children[i];
      }
      if (vChildren[i].children && typeof vChildren[i].children === 'string') {
        children[i].innerText = vChildren[i].children;
      } else if (vChildren[i].children && typeof vChildren[i].children === 'object') {
        this.traverse(vChildren[i].children, children[i]);
      }
    }
  }
  update() {}
  set(prop, value) {
    let oldValue = this[prop];
    this[prop] = value;
    this.dispatchEvent(prop + '-set', {value: value, oldValue: oldValue}, true);
  }
  dispatchEvent(eventName, detail, bubbles = true) {
    HTMLElement.prototype.dispatchEvent.call(this, new CustomEvent(eventName, {
      detail: detail,
      bubbles: bubbles,
      composed: true
    }));
  }
  bind(sourceProp) {
    return this.__node.bind(sourceProp);
  }
}

IoElement.Register = function() {
  const prototypes = new Prototypes(this);
  initStyle(prototypes);
  Object.defineProperty(this.prototype, '_properties', { value: new ProtoProperties(prototypes) });
  Object.defineProperty(this.prototype, '_listeners', { value: new ProtoListeners(prototypes) });
  Object.defineProperty(this.prototype, '_functions', { value: new ProtoFunctions(prototypes) });
  customElements.define(this.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(), this);
};

class IoNode {
  constructor() {
    this.__proto__.constructor.Register();
    Object.defineProperty(this, '__props', {value: this.__proto__._properties.clone()});
    Object.defineProperty(this, '__listeners', {value: {}});
    for (let prop in this.__props) {
      this.defineProperty(prop);
      this[prop] = this[prop];
    }
    this.__proto__._functions.bind(this);
  }
  defineProperty(prop) {
    if (this.__proto__.hasOwnProperty(prop)) return;
    Object.defineProperty(this.__proto__, prop, {
      get: function() {
        return this.__props[prop].value;
      },
      set: function(value) {
        if (this.__props[prop].value === value) return;
        let oldValue = this.__props[prop].value;
        this.__props[prop].value = value;
        if (this.__props[prop].observer) {
          this[this.__props[prop].observer](value, oldValue, prop);
        }
      },
      enumerable: true,
      configurable: true
    });
  }
  dispose() {
    // TODO
  }
  update() {}
  addEventListener(type, listener) {
		this.__listeners[type] = this.__listeners[type] || [];
		if (this.__listeners[type].indexOf(listener) === - 1) {
			this.__listeners[type].push(listener);
		}
	}
	hasEventListener(type, listener) {
		return this.__listeners[type] !== undefined && this.__listeners[type].indexOf(listener) !== - 1;
	}
	removeEventListener(type, listener) {
		if (this.__listeners[type] !== undefined) {
			let index = this.__listeners[type].indexOf(listener);
			if (index !== - 1) {
				this.__listeners[type].splice(index, 1);
			}
		}
	}
  // TODO: implement bubbling
	dispatchEvent(type, detail) {
		if (this.__listeners[type] !== undefined) {
			let array = this.__listeners[type].slice(0);
			for (let i = 0, l = array.length; i < l; i ++) {
				array[i].call(this, {detail: detail, target: this});
			}
		}
	}
}

IoNode.Register = function() {
  if (!this.registered) {
    const prototypes = new Prototypes(this);
    Object.defineProperty(this.prototype, '_properties', {value: new ProtoProperties(prototypes)});
    Object.defineProperty(this.prototype, '_functions', {value: new ProtoFunctions(prototypes)});
  }
  this.registered = true;
};

const _clickmask = document.createElement('div');
_clickmask.style = "position: fixed; top:0; left:0; bottom:0; right:0; z-index:2147483647;";

let mousedownPath = null;

class Pointer {
  constructor(pointer = {}) {
    this.position = new Vector2(pointer.position);
    this.previous = new Vector2(pointer.previous);
    this.movement = new Vector2(pointer.movement);
    this.distance = new Vector2(pointer.distance);
    this.start = new Vector2(pointer.start);
  }
  getClosest(array) {
    let closest = array[0];
    for (let i = 1; i < array.length; i++) {
      if (this.position.distanceTo(array[i].position) < this.position.distanceTo(closest.position)) {
        closest = array[i];
      }
    }
    return closest;
  }
  update(pointer) {
    this.previous.set(this.position);
    this.movement.set(pointer.position).sub(this.position);
    this.distance.set(pointer.position).sub(this.start);
    this.position.set(pointer.position);
  }
}

class Vector2 {
  constructor(vector = {}) {
    this.x = vector.x || 0;
    this.y = vector.y || 0;
  }
  set(vector) {
    this.x = vector.x;
    this.y = vector.y;
    return this;
  }
  sub(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  distanceTo(vector) {
    let dx = this.x - vector.x, dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  getClosest(array) {
    let closest = array[0];
    for (let i = 1; i < array.length; i++) {
      if (this.distanceTo(array[i]) < this.distanceTo(closest)) {
        closest = array[i];
      }
    }
    return closest;
  }
}

const IoPointerMixin = (superclass) => class extends superclass {
  static get properties() {
    return {
      pointers: Array,
      pointermode: 'relative'
    };
  }
  static get listeners() {
    return {
      'mousedown': '_onMousedown',
      'touchstart': '_onTouchstart',
      'mousemove': '_onMousehover'
    };
  }
  constructor(params) {
    super(params);
    this._clickmask = _clickmask;
  }
  getPointers(event, reset) {
    let touches = event.touches ? event.touches : [event];
    let foundPointers = [];
    let rect = this.getBoundingClientRect();
    for (let i = 0; i < touches.length; i++) {
      if (touches[i].target === event.target || event.touches === undefined) {
        let position = new Vector2({
          x: touches[i].clientX,
          y: touches[i].clientY
        });
        if (this.pointermode === 'relative') {
          position.x -= rect.left;
          position.y -= rect.top;
        } else if (this.pointermode === 'viewport') {
          position.x = (position.x - rect.left) / rect.width * 2.0 - 1.0;
          position.y = (position.y - rect.top) / rect.height * 2.0 - 1.0;
        }
        if (this.pointers[i] === undefined) this.pointers[i] = new Pointer({start: position});
        let newPointer = new Pointer({position: position});
        let pointer = newPointer.getClosest(this.pointers);
        if (reset) pointer.start.set(position);
        pointer.update(newPointer);
        foundPointers.push(pointer);
      }
    }
    for (let i = this.pointers.length; i--;) {
      if(foundPointers.indexOf(this.pointers[i]) === -1) {
        this.pointers.splice(i, 1);
      }
    }
  }
  _onMousedown(event) {
    event.preventDefault();
    this.focus();
    // TODO: fix
    mousedownPath = event.path;
    this.getPointers(event, true);
    this._fire('io-pointer-start', event, this.pointers);
    window.addEventListener('mousemove', this._onMousemove);
    window.addEventListener('mouseup', this._onMouseup);
    window.addEventListener('blur', this._onMouseup); //TODO: check pointer data
    // TODO: clickmask breaks scrolling
    if (_clickmask.parentNode !== document.body) {
      document.body.appendChild(_clickmask);
    }
  }
  _onMousemove(event) {
    this.getPointers(event);
    this._fire('io-pointer-move', event, this.pointers, mousedownPath);
  }
  _onMouseup(event) {
    this.getPointers(event);
    this._fire('io-pointer-end', event, this.pointers, mousedownPath);
    window.removeEventListener('mousemove', this._onMousemove);
    window.removeEventListener('mouseup', this._onMouseup);
    window.removeEventListener('blur', this._onMouseup);
    if (_clickmask.parentNode === document.body) {
      document.body.removeChild(_clickmask);
    }
  }
  _onMousehover(event) {
    this.getPointers(event);
    this._fire('io-pointer-hover', event, this.pointers);
  }
  _onTouchstart(event) {
    event.preventDefault();
    this.focus();
    this.getPointers(event, true);
    this._fire('io-pointer-hover', event, this.pointers);
    this._fire('io-pointer-start', event, this.pointers);
    this.addEventListener('touchmove', this._onTouchmove);
    this.addEventListener('touchend', this._onTouchend);
  }
  _onTouchmove(event) {
    event.preventDefault();
    this.getPointers(event);
    this._fire('io-pointer-move', event, this.pointers);
  }
  _onTouchend(event) {
    event.preventDefault();
    this.removeEventListener('touchmove', this._onTouchmove);
    this.removeEventListener('touchend', this._onTouchend);
    this._fire('io-pointer-end', event, this.pointers);

  }
  _fire(eventName, event, pointer, path) {
    this.dispatchEvent(eventName, {event: event, pointer: pointer, path: path || event.path}, false);
  }
};

// TODO: remove?
// export * from "./elements/app/index.js";
// export * from "./elements/io/index.js";
// export * from "./elements/menu/index.js";
// export * from "./elements/three/index.js";

export { html, IoElement, IoNode, Pointer, Vector2, IoPointerMixin };
