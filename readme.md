# io: custom elements library for data-centric web applications

* configurable
* styleable
* lightweight
* native
* data-driven
* application dataflow top-down
* user input dataflow bottom-up/transversal

### Defining properties, listeners and default attributes

```javascript
static get properties() {
  return {
    value: {
      type: String,
      value: 'hello',
      observer: '_update',
      reflectToAttribute: true,
      notify: true,
      bubbles: true
    },
    listeners: {
      'keyup': '_keyupHandler'
    },
    attributes: {
      'tabindex': 0
    }
  }
}
```

### Styling elements

```javascript
static get shadowStyle() {
  return html`
    <style>
      :host {
        display: inline-block;
      }
    </style>
  `;
}
static get style() {
  return html`
    <style>
      :host > div > span {
        color: tomato;
      }
    </style>
  `;
}
```

### Rendering DOM and ShadowDOM

```javascript
let elements = ['apple', 'banana', 'avocado'];

const Fruit = (elem, i) => ['span', {className: 'fruit'}, elem];
this.render([
  ['h4', 'List of Fruits:'],
  ['div', [
    elements.map(Fruit)
  ]]
]);

```

```html
<h4>List of Fruits:</h4>
<div>
  <span class="fruit">apple</span>
  <span class="fruit">banana</span>
  <span class="fruit">avocado</span>
</div>
```

```javascript
this.render([
  ['style'],
  ['slot']
], this.shadowRoot);

```