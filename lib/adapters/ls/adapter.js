/*
  Localstorage adapter
*/

import Server from './server';

export default class LSAdapter {

  constructor() {
    this.server = new Server();
  }

  create(record) {
    let id = record.state.id;
    let url = record.props.model.url + (id ? id : '');
    return this.server.request(url, {
      method: id ? 'PUT' : 'POST',
      data: record.state
    });
  }

  read(url) {
    return this.server.get(url, {method: 'GET'});
  }

  update(record) {
  }

  delete(record) {
    let id = record.state.id;
    if (id) {
      let url = record.props.model.url + id;
      return this.server.request(url, {method: 'DELETE'});
    } else {
      // This resource doesn't exist on the server, so resolve immediately.
      return new Promise(resolve => resolve());
    }
  }

}
