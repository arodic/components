/**
 * Collection of all listeners defined in the prototype chain.
 */
class ProtoListeners {
  /**
   * Creates a collection of all listeners from protochain.
   * @param {ProtoChain} protochain - Array of protochain constructors.
   */
  constructor(protochain) {
    for (let i = protochain.length; i--;) {
      const prop = protochain[i].constructor.Listeners;
      for (let j in prop) this[j] = prop[j];
    }
  }
}

/**
 * Manager of listeners for a class **instance**.
 */
class Listeners {
  /**
   * Creates manager for listener.
   * @param {Node} node - Reference to the node/element itself.
   * @param {ProtoListeners} protoListeners - Collection of all listeners defined in the protochain.
   */
  constructor(node, protoListeners) {
    Object.defineProperty(this, 'node', {value: node});
    Object.defineProperty(this, 'propListeners', {value: {}});
    Object.defineProperty(this, 'activeListeners', {value: {}});
    Object.defineProperty(this, '__isConnected', {writable: true});
    for (let prop in protoListeners) this[prop] = protoListeners[prop];
  }
  /**
   * Sets listeners from inline properties (filtered form properties map by 'on-' prefix).
   * @param {Object} props - Properties.
   */
  setPropListeners(props) {
    // TODO: Unset propListeners, test.
    const listeners = this.propListeners;
    const node = this.node;
    const newListeners = {};
    for (let l in props) {
      if (l.startsWith('on-')) newListeners[l.slice(3, l.length)] = props[l];
    }
    for (let l in newListeners) {
      if (listeners[l]) {
        if (listeners[l] instanceof Array) {
          const listener = typeof listeners[l][0] === 'function' ? listeners[l][0] : node[listeners[l][0]];
          node.removeEventListener(l, listener, listeners[l][1]);
        } else {
          const listener = typeof listeners[l] === 'function' ? listeners[l] : node[listeners[l]];
          node.removeEventListener(l, listener);
        }
      }
      listeners[l] = newListeners[l];
      if (this.__isConnected) {
        if (newListeners[l] instanceof Array) {
          const listener = typeof newListeners[l][0] === 'function' ? newListeners[l][0] : node[newListeners[l][0]];
          node.addEventListener(l, listener, newListeners[l][1]);
        } else {
          const listener = typeof newListeners[l] === 'function' ? newListeners[l] : node[newListeners[l]];
          node.addEventListener(l, listener);
        }
      }
    }
  }
  /**
   * Connects all event listeners.
   */
  connect() {
    this.__isConnected = true;
    const node = this.node;
    const listeners = this.propListeners;
    for (let l in this) {
      if (this[l] instanceof Array) {
        this.addEventListener(l, node[this[l][0]], this[l][1]);
      } else {
        this.addEventListener(l, node[this[l]]);
      }
    }
    for (let l in listeners) {
      if (listeners[l] instanceof Array) {
        const listener = typeof listeners[l][0] === 'function' ? listeners[l][0] : node[listeners[l][0]];
        this.addEventListener(l, listener, listeners[l][1]);
      } else {
        const listener = typeof listeners[l] === 'function' ? listeners[l] : node[listeners[l]];
        this.addEventListener(l, listener);
      }
    }
  }
  /**
   * Disconnects all event listeners.
   */
  disconnect() {
    this.__isConnected = false;
    const node = this.node;
    const listeners = this.propListeners;
    for (let l in this) {
      if (this[l] instanceof Array) {
        this.removeEventListener(l, node[this[l][0]], this[l][1]);
      } else {
        this.removeEventListener(l, node[this[l]]);
      }
    }
    for (let l in listeners) {
      if (listeners[l] instanceof Array) {
        const listener = typeof listeners[l][0] === 'function' ? listeners[l][0] : node[listeners[l][0]];
        this.removeEventListener(l, listener, listeners[l][1]);
      } else {
        const listener = typeof listeners[l] === 'function' ? listeners[l] : node[listeners[l]];
        this.removeEventListener(l, listener);
      }
    }
  }
  /**
   * Disconnects all event listeners and removes all references.
   * Use this when node is no longer needed.
   */
  dispose() {
    // TODO: test
    this.disconnect();
    const active = this.activeListeners;
    for (let i in active) {
      for (let j = active[i].length; j--;) {
        if (this.node.__isIoElement) HTMLElement.prototype.removeEventListener.call(this.node, i, active[i][j]);
        active[i].splice(j, 1);
      }
    }
  }
  /**
   * Proxy for `addEventListener` method.
   * Adds an event listener.
   * @param {string} type - event name to listen to.
   * @param {function} listener - event handler function.
   * @param {Object} options - event listener options.
   */
  addEventListener(type, listener, options) {
    const active = this.activeListeners;
    active[type] = active[type] || [];
    const i = active[type].indexOf(listener);
    if (i === -1) {
      if (this.node.__isIoElement) HTMLElement.prototype.addEventListener.call(this.node, type, listener, options);
      active[type].push(listener);
    }
  }
  /**
   * Proxy for `removeEventListener` method.
   * Removes an event listener.
   * @param {string} type - event name to listen to.
   * @param {function} listener - event handler function.
   * @param {Object} options - event listener options.
   */
  removeEventListener(type, listener, options) {
    const active = this.activeListeners;
    if (active[type] !== undefined) {
      const i = active[type].indexOf(listener);
      if (i !== - 1 || listener === undefined) {
        if (this.node.__isIoElement) HTMLElement.prototype.removeEventListener.call(this.node, type, listener, options);
        active[type].splice(i, 1);
      }
    }
  }
  /**
   * Shorthand for custom event dispatch.
   * @param {string} type - event name to dispatch.
   * @param {Object} detail - event detail.
   * @param {boolean} bubbles - event bubbles.
   * @param {HTMLElement|Node} src source node/element to dispatch event from.
   */
  dispatchEvent(type, detail = {}, bubbles = true, src = this.node) {
    if (src instanceof HTMLElement || src === window) {
      HTMLElement.prototype.dispatchEvent.call(src, new CustomEvent(type, {type: type, detail: detail, bubbles: bubbles, composed: true, cancelable: true}));
    } else {
      const active = this.activeListeners;
      if (active[type] !== undefined) {
        const array = active[type].slice(0);
        for (let i = 0; i < array.length; i ++) {
          array[i].call(src, {detail: detail, target: src, path: [src]});
          // TODO: consider bubbling.
        }
      }
    }
  }
}

export {ProtoListeners, Listeners};
