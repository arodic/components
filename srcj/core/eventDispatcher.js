export class ProtoListeners {
    constructor(protochain) {
        for (let i = protochain.length; i--;) {
            const listeners = protochain[i].Listeners;
            for (let l in listeners) {
                const listener = (listeners[l] instanceof Array) ? listeners[l] : [listeners[l]];
                this[l] = listener;
            }
        }
    }
}
/**
 * Event Dispatcher.
 */
class EventDispatcher {
    /**
     * Creates Event Dispatcher.
     */
    constructor(node, protoListeners) {
        this.__propListeners = {};
        this.__connectedListeners = {};
        this.__disconnectedListeners = {};
        this.__listenerOptions = new WeakMap();
        this.__connected = false;
        this.__node = node;
        this.__protoListeners = protoListeners;
        Object.defineProperty(this, '__node', { enumerable: false, writable: false });
        Object.defineProperty(this, '__protoListeners', { enumerable: false, writable: false });
        Object.defineProperty(this, '__propListeners', { enumerable: false, writable: false });
        Object.defineProperty(this, '__connectedListeners', { enumerable: false });
        Object.defineProperty(this, '__disconnectedListeners', { enumerable: false });
        Object.defineProperty(this, '__listenerOptions', { enumerable: false, writable: false });
        Object.defineProperty(this, '__connected', { enumerable: false });
    }
    /**
     * Sets listeners from inline properties (filtered form properties map by 'on-' prefix).
     * @param {Object} properties - Properties.
     */
    setPropListeners(properties) {
        // TODO: Unset propListeners, test.
        const listeners = this.__propListeners;
        const newListeners = {};
        for (let prop in properties) {
            if (prop.startsWith('on-')) {
                const type = prop.slice(3, prop.length);
                const listener = (properties[prop] instanceof Array)
                    ? [properties[prop][0], properties[prop][1]]
                    : [properties[prop]];
                if (typeof listener[0] !== 'function')
                    listener[0] = this.__node[listener[0]];
                newListeners[type] = listener;
            }
        }
        for (let type in newListeners) {
            if (listeners[type]) {
                this.__node.removeEventListener(type, listeners[type][0], listeners[type][1]);
            }
            listeners[type] = newListeners[type];
            if (this.__connected) {
                this.__node.addEventListener(type, listeners[type][0], newListeners[type][1]);
            }
        }
    }
    /**
     * Connects all event listeners.
     */
    connect() {
        debug: {
            if (this.__connected)
                console.error('EventDispatcher: already connected!');
        }
        this.__connected = true;
        for (let type in this.__protoListeners) {
            const isFunction = typeof this.__protoListeners[type][0] === 'function';
            const listener = isFunction ? this.__protoListeners[type][0] : this.__node[this.__protoListeners[type][0]];
            this.addEventListener(type, listener, this.__protoListeners[type][1]);
        }
        for (let type in this.__propListeners) {
            this.addEventListener(type, this.__propListeners[type][0], this.__propListeners[type][1]);
        }
        for (let type in this.__disconnectedListeners) {
            for (let i = this.__disconnectedListeners[type].length; i--;) {
                const listener = this.__disconnectedListeners[type][i];
                const options = this.__listenerOptions.get(listener);
                debug: {
                    if (this.__connectedListeners[type].indexOf(listener) !== -1) {
                        console.error(`EventDispatcher: event ${type} already connected!`);
                    }
                }
                this.addEventListener(type, listener, options);
                this.__disconnectedListeners[type].splice(i, 1);
            }
        }
    }
    /**
     * Disconnects all event listeners.
     */
    disconnect() {
        debug: {
            if (!this.__connected)
                console.error('EventDispatcher: already disconnected!');
        }
        for (let type in this.__protoListeners) {
            const isFunction = typeof this.__protoListeners[type][0] === 'function';
            const listener = isFunction ? this.__protoListeners[type][0] : this.__node[this.__protoListeners[type][0]];
            this.removeEventListener(type, listener, this.__protoListeners[type][1]);
        }
        for (let type in this.__propListeners) {
            this.removeEventListener(type, this.__propListeners[type][0], this.__propListeners[type][1]);
        }
        for (let type in this.__connectedListeners) {
            this.__disconnectedListeners[type] = this.__disconnectedListeners[type] || [];
            for (let i = this.__connectedListeners[type].length; i--;) {
                const listener = this.__connectedListeners[type][i];
                const options = this.__listenerOptions.get(listener);
                debug: {
                    if (this.__disconnectedListeners[type].indexOf(listener) !== -1) {
                        console.error(`EventDispatcher: event ${type} already disconnected!`);
                    }
                }
                this.removeEventListener(type, listener, options);
                this.__disconnectedListeners[type].push(listener);
            }
        }
        this.__connected = false;
    }
    /**
     * Proxy for `addEventListener` method.
     * Adds an event listener.
     */
    addEventListener(type, listener, options) {
        this.__connectedListeners[type] = this.__connectedListeners[type] || [];
        const i = this.__connectedListeners[type].indexOf(listener);
        if (i === -1) {
            if (this.__node.__isIoElement) {
                HTMLElement.prototype.addEventListener.call(this.__node, type, listener, options);
            }
            this.__connectedListeners[type].push(listener);
            this.__listenerOptions.set(listener, options);
        }
    }
    /**
     * Proxy for `removeEventListener` method.
     * Removes an event listener.
     */
    removeEventListener(type, listener, options) {
        if (!this.__connected) {
            this.__disconnectedListeners[type] = this.__disconnectedListeners[type] || [];
            if (listener === undefined) {
                this.__disconnectedListeners[type].length = 0;
            }
            else {
                const i = this.__disconnectedListeners[type].indexOf(listener);
                if (i !== -1)
                    this.__disconnectedListeners[type].splice(i, 1);
                debug: {
                    if (i === -1) {
                        console.error(`EventDispatcher: event ${type} not found!`);
                    }
                }
            }
        }
        else {
            this.__connectedListeners[type] = this.__connectedListeners[type] || [];
            if (listener === undefined) {
                /// TODO: test
                for (let i = this.__connectedListeners[type].length; i--;) {
                    const listener = this.__connectedListeners[type][i];
                    const options = this.__listenerOptions.get(listener);
                    debug: {
                        if (this.__connectedListeners[type].indexOf(listener) === -1) {
                            console.error(`EventDispatcher: event ${type} already disconnected!`);
                        }
                    }
                    if (this.__node.__isIoElement) {
                        HTMLElement.prototype.removeEventListener.call(this.__node, type, listener, options);
                    }
                }
                this.__connectedListeners[type].length = 0;
            }
            else {
                const i = this.__connectedListeners[type].indexOf(listener);
                if (this.__node.__isIoElement) {
                    options = options || this.__listenerOptions.get(listener);
                    HTMLElement.prototype.removeEventListener.call(this.__node, type, listener, options);
                }
                if (i !== -1)
                    this.__connectedListeners[type].splice(i, 1);
                debug: {
                    // TODO: investigate why this happens a lot for floating menu-options.
                    if (i === -1)
                        console.warn(`EventDispatcher: event ${type} not found!`);
                }
            }
        }
    }
    /**
     * Shorthand for custom event dispatch.
     */
    dispatchEvent(type, detail = {}, bubbles = true, src = this.__node) {
        if ((src instanceof HTMLElement || src === window)) {
            HTMLElement.prototype.dispatchEvent.call(src, new CustomEvent(type, { detail: detail, bubbles: bubbles, composed: true, cancelable: true }));
        }
        else {
            const active = this.__connectedListeners;
            if (active[type] !== undefined) {
                const array = active[type].slice(0);
                for (let i = 0; i < array.length; i++) {
                    array[i].call(src, { detail: detail, target: src, path: [src] });
                    // TODO: consider bubbling.
                }
            }
        }
    }
    /**
     * Disconnects all event listeners and removes all references.
     * Use this when node is no longer needed.
     */
    dispose() {
        // TODO: test
        if (this.__connected)
            this.disconnect();
        delete this.__node;
        delete this.__protoListeners;
        delete this.__propListeners;
        delete this.__connectedListeners;
        delete this.__disconnectedListeners;
        delete this.__listenerOptions;
        delete this.__connected;
    }
}
export { EventDispatcher };
//# sourceMappingURL=eventDispatcher.js.map