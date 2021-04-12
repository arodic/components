import { ProtoChain } from './protoChain.js';
import { IoNode } from '../components/io-node.js';
declare type ProtoListenerType = keyof IoNode | EventListenerOrEventListenerObject | ProtoListenerArrayType;
declare type ProtoListenerArrayType = [keyof IoNode | EventListenerOrEventListenerObject, AddEventListenerOptions | undefined];
export declare class ProtoListeners {
    [listener: string]: ProtoListenerArrayType;
    constructor(protochain: ProtoChain);
}
/**
 * Event Dispatcher.
 */
declare class EventDispatcher {
    private readonly __node;
    private readonly __protoListeners;
    private readonly __propListeners;
    private readonly __connectedListeners;
    private readonly __disconnectedListeners;
    private readonly __listenerOptions;
    private __connected;
    /**
     * Creates Event Dispatcher.
     */
    constructor(node: IoNode, protoListeners: ProtoListeners);
    /**
     * Sets listeners from inline properties (filtered form properties map by 'on-' prefix).
     * @param {Object} properties - Properties.
     */
    setPropListeners(properties: Record<string, ProtoListenerType>): void;
    /**
     * Connects all event listeners.
     */
    connect(): this;
    /**
     * Disconnects all event listeners.
     */
    disconnect(): this;
    /**
     * Proxy for `addEventListener` method.
     * Adds an event listener.
     */
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
    /**
     * Proxy for `removeEventListener` method.
     * Removes an event listener.
     */
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): void;
    /**
     * Shorthand for custom event dispatch.
     */
    dispatchEvent(type: string, detail?: Record<string, any>, bubbles?: boolean, src?: Window | Document | HTMLElement | IoNode): void;
    /**
     * Disconnects all event listeners and removes all references.
     * Use this when node is no longer needed.
     */
    dispose(): void;
}
export { EventDispatcher };
//# sourceMappingURL=eventDispatcher.d.ts.map