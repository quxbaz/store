/*
  Localstorage adapter
*/

import Server from './server';

export default class LSAdapter {

  constructor() {
    this.server = new Server();
  }

  create(url, data) {
    return this.server.request(url, {
      method: 'POST',
      data
    });
  }

  read(url) {
    return this.server.get(url, {method: 'GET'});
  }

  update(url) {
  }

  delete(url) {
    return this.server.request(url, {method: 'DELETE'});
  }

}
