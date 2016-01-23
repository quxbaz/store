/*
  Localstorage adapter
*/

import Server from './server';

export default class LSAdapter {

  constructor() {
    this.server = new Server();
  }

  save(record) {
    let id = record.state.id;
    let url = record.props.model.url + (id ? id : '');
    return this.server.request(url, {
      method: id ? 'PUT' : 'POST',
      data: record.state
    });
  }

  destroy(record) {
    let id = record.state.id;
    if (id) {
      let url = record.props.model.url + id;
      return this.server.request(url, {method: 'DELETE'});
    } else
      return new Promise(resolve => resolve());
  }

}
