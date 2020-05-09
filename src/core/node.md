### .NodeMixin(superclass: `function`) : function

Core mixin for `Node` classes.

### classConstructor(initProps: `Object`)

Creates `Node` instance and initializes internals.

### .connect(owner: `Node`)

Connects Node to the application.

### .disconnect(owner: `Node`)

Disconnects Node from the application.

### .preventDefault(event: `Object`)

Handler function with `event.preventDefault()`.

### .stopPropagation(event: `Object`)

Handler function with `event.stopPropagation()`.

### .changed()

default change handler.

### .applyCompose()

Applies compose object on change.

### .bind(prop: `string`) : Binding

Returns a binding to a specified property`.

### .unbind(prop: `string`)

Unbinds a binding to a specified property`.

### .set(prop: `string`, value: `*`, force: `boolean`)

Sets a property and emits `[property]-set` event.
Use this when property is set by user action (e.g. mouse click).

### .setProperties(props: `Object`)

Sets multiple properties in batch.
[property]-changed` events will be broadcast in the end.

### .objectMutatedThrottled(prop: `string`)

This function is called when `object-mutated` event is observed
and changed object is a property of the node.

### .connectedCallback()

Callback when `Node` is connected.

### .disconnectedCallback()

Callback when `Node` is disconnected.

### .dispose()

Disposes all internals.
Use this when node is no longer needed.

### .addEventListener(type: `string`, listener: `function`, options: `Object`)

Wrapper for addEventListener.

### .removeEventListener(type: `string`, listener: `function`, options: `Object`)

Wrapper for removeEventListener.

### .dispatchEvent(type: `string`, detail: `Object`, bubbles: `boolean`, src: `HTMLElement`)

Wrapper for dispatchEvent.

### .queue(prop: `string`, value: `*`, oldValue: `*`)

Adds property change to the queue.

### .queueDispatch()

Dispatches the queue.

### .throttle(func: `function`, arg: `*`, asynchronous: `boolean`)

Throttles function execution to next frame (rAF) if the function has been executed in the current frame.

### .Register()

Register function to be called once per class.

## Node

NodeMixin applied to `Object` class.

