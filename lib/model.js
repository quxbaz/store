/*
  Model class
*/

import Record from './record';
import types from './types';

export default class Model {

  constructor(name, url, schema, props) {
    this.name = name;
    this.url = url;             // <TODO> url must begin and end with a slash
    this.schema = schema;
    this.props = props;
  }

  createRecord(state) {
    return new Record(state, {
      model: this,
      store: this.props.store
    });
  }

  validate(state) {
    return state;
  }

}
