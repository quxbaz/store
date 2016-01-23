/*
  store.js

  <API>

  store.registerModel(name, url, schema={})
  store.createRecord(modelName, state={})
  store.get(modelName, id)
  store.all(modelName)

*/


import Model from './model';
import {byId} from './util';

export default class Store {

  constructor(props) {
    this.models = {};
    this.props = props;
  }

  registerModel(name, url, schema={}) {
    if (this.models.hasOwnProperty(name))
      throw new Error(`Model "${name}" already exists.`);
    this.models[name] = new Model(name, url, schema, {store: this});
  }

  createRecord(modelName, state={}) {
    return this.models[modelName].createRecord(state);
  }

  saveRecord(record) {
    return this.props.adapter.save(record);
  }

  destroyRecord(record) {
    return this.props.adapter.destroy(record);
  }

  // get(modelName, id) {
  //   let {model, records} = this.modelAndRecords(modelName);
  //   return new Promise((resolve, reject) => {

  //     // Check cache first
  //     let record = records.find(byId);

  //     // If not found in cache, make a fetch
  //     if (record === undefined) {
  //       this.props.adapter.get(model, id).then(
  //         state => resolve(this.store.createRecord(modelName, state)),
  //         error => reject(error)
  //       );
  //     } else
  //       resolve(record);

  //   });
  // };

  all(modelName) {
  }

}
