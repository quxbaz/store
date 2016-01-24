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
    if (!props.adapter)
      throw new Error('You must provide an adapter.');
    this.models = {};
    this._cache = {};   // Records cache
    // Flags set to true when all records of a model have been
    // fetched. Keyed by model name.
    this.fetchedAll = {};
  }

  registerModel(name, url, schema={}) {
    if (this.models.hasOwnProperty(name))
      throw new Error(`Model "${name}" already exists.`);
    this.models[name] = new Model(name, url, schema, {store: this});
    this._cache[name] = new Set();
  }

  createRecord(modelName, state={}, cache=false) {
    let record = this.models[modelName].createRecord(state);
    if (cache)
      this.cache(record);
    return record;
  }

  cache(record) {
    let model = record.props.model;
    this._cache[model.name].add(record);
  }

  saveRecord(record) {
    let url = record.props.model.url;
    let id = record.state.id;
    if (id)
      return this.props.adapter.update(url + id, record.state);
    else {
      return this.props.adapter.create(url, record.state).then((data) => {
        this.cache(record);
        return data;
      });
    }
  }

  destroyRecord(record) {
    let id = record.state.id;
    if (id) {
      let url = record.props.model.url + id;
      return this.props.adapter.delete(url).then((resp) => {
        let modelName = record.props.model.name;
        this._cache[modelName].delete(record);
        return resp;
      });
    } else {
      // Resolve immediately because this resource doesn't exist on
      // the server and nothings need to be done.
      return new Promise.resolve();
    }
  }

  searchCache(modelName, id) {
    for (let record of this._cache[modelName]) {
      if (record.state.id === id)
        return record;
    }
  }

  get(modelName, id) {
    let hit = this.searchCache(modelName, id);
    if (hit)
      return Promise.resolve(hit);
    let url = this.models[modelName].url + id;
    return this.props.adapter.read(url).then(
      data => this.createRecord(modelName, data, true),
      (error) => {
        throw new Error(error);
      }
    );
  }

  all(modelName) {
    if (this.fetchedAll[modelName])
      return Promise.resolve(Array.from(this._cache[modelName]));
    let url = this.models[modelName].url;
    return this.props.adapter.read(url).then(
      (dataList) => {
        this.fetchedAll[modelName] = true;
        return dataList.map((data) => {
          let record = this.searchCache(modelName, data.id);
          if (record)
            return record;
          else
            return this.createRecord(modelName, data, true);
        });
      }, (error) => {
        throw new Error(error);
      }
    );
  }

}
