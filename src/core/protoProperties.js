export class ProtoProperties {
  constructor(prototypes = []) {
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
    let properties = new ProtoProperties();
    for (let prop in this) {
      properties[prop] = this[prop].clone();
    }
    return properties;
  }
}

export class Property {
  constructor(propDef) {
    if (propDef === null || propDef === undefined) {
      propDef = {};
    } else if (typeof propDef === 'function') {
      propDef = {type: propDef};
    } else if (typeof propDef !== 'object') {
      propDef = {value: propDef, type: propDef.constructor};
    }
    if (!propDef.value && propDef.type) {
      if (propDef.type === Boolean) propDef.value = false;
      else if (propDef.type === String) propDef.value = '';
      else if (propDef.type === Number) propDef.value = 0;
      else if (propDef.type === Array) propDef.value = [];
      else if (propDef.type === Object) propDef.value = {};
      else if (propDef.type !== HTMLElement) propDef.value = new propDef.type();
    }
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
      for (let p in value) {
        prop.value[p] = value[p];
      }
    }
    return prop;
  }
}
