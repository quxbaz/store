/*
  store.js

  <Usage>

  // There should usually only be one of these.
  let store = new Store();

  store.registerModel('Person');

  // Retrieving
  store.get('person', 42);
  store.all('person').then(...)

  // Creating records
  let bob = store.createRecord('person', {name: 'Bob'});
  bob.get('name') => 'Bob'

  <TODO>
  Unit tests
*/

export default class Store {

  constructor() {
    this.records = {};
  }

  registerModel(modelName) {
    if (this.records.hasOwnProperty(modelName))
      throw new Error(`Model "${modelName}" already exists.`);
    this.records[modelName] = [];
  }

  createRecord(modelName, state={}) {
    let record = new Record(this, modelName, state);
    this.records[modelName].push(record);
    return record;
  }

  destroyRecord(modelName, record) {
    let records = this.records[modelName];
    let i = records.indexOf(record);
    records.splice(i, 1);
  }

  get(modelName, id) {
    /*
      <TODO>
      Memoize this
    */
    let record = this.records[modelName].find(
      record => record.state.id == id
    );
    // if (typeof record === 'undefined')
      // then perform a fetch using the adapter
    return record;
  }

}
