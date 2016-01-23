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

  get(modelName, id) {
    let url = this.models[modelName].url + id;
    return this.props.adapter.read(url).then(
      data => this.createRecord(modelName, data),
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
