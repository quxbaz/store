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
    this.props = props;
    this.models = {};
    this.cache = {};  // Records cache
  }

  registerModel(name, url, schema={}) {
    if (this.models.hasOwnProperty(name))
      throw new Error(`Model "${name}" already exists.`);
    this.models[name] = new Model(name, url, schema, {store: this});
    this.cache[name] = new Set();
  }

  createRecord(modelName, state={}) {
    let record = this.models[modelName].createRecord(state);
    this.cache[modelName].add(record);
    return record;
  }

  saveRecord(record) {
    let url = record.props.model.url;
    let id = record.state.id;
    if (id)
      return this.props.adapter.update(url + id, record.state);
    else
      return this.props.adapter.create(url, record.state);
  }

  destroyRecord(record) {
    let id = record.state.id;
    if (id) {
      let url = record.props.model.url + id;
      return this.props.adapter.delete(url);
    } else {
      // Resolve immediately because this resource doesn't exist on
      // the server.
      return new Promise.resolve();
    }
  }

  searchCache(modelName, id) {
    for (let record of this.cache[modelName]) {
      if (record.state.id == id)
        return record;
    }
  }

  get(modelName, id) {
    let hit = this.searchCache(modelName, id);
    if (hit)
      return Promise.resolve(hit);
    let url = this.models[modelName].url + id;
    return this.props.adapter.read(url).then(
      (data) => {
        let record = this.createRecord(modelName, data);
        this.cache[modelName].add(record);
        return record;
      },
      (error) => {
        throw new Error(error);
      }
    );
  }

  all(modelName) {
    let url = this.models[modelName].url;
    return this.props.adapter.read(url).then(
      dataList => dataList.map(data => this.createRecord(modelName, data)),
      (error) => {
        throw new Error(error);
      }
    );
  }

}
