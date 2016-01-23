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
    return this.props.adapter.create(record);
  }

  destroyRecord(record) {
    return this.props.adapter.delete(record);
  }

  get(modelName, id) {
    let url = this.models[modelName].url + id;
    return this.props.adapter.read(url).then((data) => {
      return this.createRecord(modelName, data);
    });
  }

  all(modelName) {
  }

}
