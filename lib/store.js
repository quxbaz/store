/*
  store.js
*/

import Sentry from 'sentry';
import Model from './model';
import {capitalize, byId} from './util';

export default class Store extends Sentry {

  constructor(props={}) {
    super();
    this.props = props;
    if (!props.adapter)
      throw new Error('You must provide an adapter.');
    this.models = {};
    this._cache = {};   // Records cache
    // Flags set to true when all records of a model have been
    // fetched. Keyed by model name.
    this.fetchedAll = new Set();
  }

  define(name, opts={}) {
    /*
      @name: Name of the model
      @opts: {@url, @schema}
    */
    if (this.models.hasOwnProperty(name))
      throw new Error(`Model "${name}" already exists.`);
    this.models[name] = new Model(name, opts, {store: this});
    this._cache[name] = new Set();
    this[capitalize(name)] = {
      create: (state, cache) => this.create(name, state, cache),
      get: (id, sync) => this.get(name, id, sync),
      all: (sync) => this.all(name, sync),
      one: (sync) => this.one(name, sync),
      alwaysOne: (sync) => this.alwaysOne(name, sync)
    };
  }

  get(modelName, id, sync=false) {

    if (this.models[modelName] === undefined)
      throw new Error('Model @' + modelName + ' is not defined.');
    if (id === undefined)
      throw new Error('You must provide an id.');

    let hit = this.searchCache(modelName, id);
    if (hit) {
      if (sync)
        return hit;
      else
        return Promise.resolve(hit);
    } else if (sync)
      throw new Error('Resource not found.');

    let model = this.models[modelName];
    return this.props.adapter.read(model, id).then(
      data => this.create(modelName, data),
      (error) => {
        throw new Error(error);
      }
    );

  }

  all(modelName, sync=false) {

    if (Array.isArray(modelName)) {
      if (sync) {
        modelName.map((modelName) => this.all(modelName, true));
      } else {
        return Promise.all(modelName.map(
          (modelName) => this.all(modelName)
        ));
      }
    }

    if (this.models[modelName] === undefined)
      throw new Error('Model @' + modelName + ' is not defined.');

    if (this.fetchedAll.has(modelName)) {
      let arr = Array.from(this._cache[modelName]) ;
      if (sync)
        return arr;
      else
        return Promise.resolve(arr);
    } else if (sync)
      throw new Error('Resource not cached. Cannot fetch synchronously.');

    let model = this.models[modelName];
    return this.props.adapter.read(model).then(
      (dataList) => {
        this.fetchedAll.add(modelName)
        return dataList.map((data) => {
          let record = this.searchCache(modelName, data.id);
          if (record)
            return record;
          else
            return this.create(modelName, data);
        });
      }, (error) => {
        throw new Error(error);
      }
    ).then((records) => {
      let allRecords = new Set(records);
      // This includes non-persisted records.
      for (let record of this._cache[modelName])
        allRecords.add(record);
      return Array.from(allRecords);
    });

  }

  one(modelName, sync) {
    /*
      Fetches a single model. If the request returns more than a
      single model, rejects with an error.
    */
    if (sync) {
      let records = this._cache[modelName];
      if (records.size === 0)
        throw new Error('No records found.');
      else if (records.size > 1)
        throw new Error('Only expected a single record.');
      return Array.from(records)[0];
    } else {
      return this.all(modelName).then((records) => {
        if (records.length === 0)
          return Promise.reject('No records found.');
        else if (records.length > 1)
          return Promise.reject('Only expected a single record.');
        return records[0];
      });
    }
  }

  alwaysOne(modelName, syc) {
    /*
      Fetches a single model or creates one if none exist. If multiple
      models are fetched, rejects with an error.
    */
    return this.all(modelName).then((records) => {
      switch (records.length) {
        case 0:
          return this.create(modelName);
        case 1:
          return records[0];
      }
      return Promise.reject('Received multiple records.');
    });
  }

  create(modelName, state={}, cache=true) {
    let record = this.models[modelName].create(state);
    if (cache)
      this.cache(record);
    this.trigger('addRecord', record);
    return record;
  }

  saveRecord(record) {
    if (record.state.id)
      return this.props.adapter.update(record);
    else
      return this.props.adapter.create(record);
  }

  destroyRecord(record) {
    if (record.state.id) {
      return this.props.adapter.delete(record).then((resp) => {
        let {name} = record.props.model;
        this._cache[name].delete(record);
        return resp;
      });
    } else {
      // Resolve immediately because this resource doesn't exist on
      // the server and nothings need to be done.
      return Promise.resolve();
    }
  }

  cache(record) {
    let {model} = record.props;
    this._cache[model.name].add(record);
  }

  searchCache(modelName, id) {
    return Array.from(this._cache[modelName]).find(byId(id));
  }

}
