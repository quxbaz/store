class Record {

  constructor(store, modelName, state={}) {
    this.store = store;
    this.modelName = modelName;
    this.state = state;
  }

  setState(state) {
    Object.assign(this.state, state);
  }

  save(props) {
    /*
      Applies an adapter to save the record to some source (ie,
      server, localstorage, cookies, etc.)
    */
  }

  destroy() {
    /*
      Applies an adapter to destroy the record from some source.
    */
    // this.store.destroyRecord(this.modelName, this);
  }

}
