/*
  Model class
*/

import Record from './record';

export default class Model {

  constructor(name, url, schema, props) {
    this.name = name;
    this.url = this.validateUrl(url);
    this.schema = schema;
    this.props = props;
  }

  validateUrl(url) {
    // url must begin and end with a slash.
    let first = url[0];
    let last = url[url.length-1];
    if (first === '/' && last === '/')
      return url;
    throw new Error('@url must begin and end with a forward slash.');
  }

  createRecord(state) {
    return new Record(state, {
      model: this,
      store: this.props.store
    });
  }

}
