/*
  bin.js

  A LocalStorage wrapper that supports sub-containers.

  <API>
  bin.get(bin, key)
  bin.set(bin, key, value)
  bin.all(bin)
*/


const LS = localStorage;
const sep = '::';

export default class {

  constructor() {
    this.cache = {};
    // Cache all of localStorage up-front.
    Object.keys(LS).forEach((key) => {
      this.cache[key] = JSON.parse(LS.getItem(key));
    });
  }

  set(bin, key, value) {
    let q = this.queryString(bin, key);
    this.cache[q] = value;
    LS.setItem(q, JSON.stringify(value));
  }

  get(bin, key) {
    return this.cache[this.queryString(bin, key)];
  }

  all(bin) {
    return Object.keys(LS).filter(
      wholeKey => new RegExp('^' + bin + sep).test(wholeKey)
    ).map(wholeKey => this.cache[wholeKey]);
  }

  queryString(bin, key) {
    return bin + sep + key;
  }

}
