class Record {

  constructor(modelName, store, props={}) {
    this.modelName = modelName;
    this.store = store;
    this._props = props;
  }

  get(prop) {
    return this._props[prop];
  }

  set(key, val) {
    /*
      Sets a property or collection of properties. Can take either
      (key, val) or a map of properties.
    */
    if (typeof key === 'string')
      this._props[key] = val;
    else if (typeof key === 'object')
      Object.assign(this._props, key);
  }

  save(props) {
    /*
      Applies an adapter to save the record to some source (ie,
      server, localstorage, cookies, etc.)
    */
  }

  destroy() {
    /*
      Applies an adapter to destory the record from some source.
    */
    this.store.destroyRecord(this.modelName, this);
  }

}
