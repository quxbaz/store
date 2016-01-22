/*
  bin.js

  A wrapper around localStorage that supports sub-containers.
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

  queryString(bin, key) {
    return bin + sep + key;
  }

  set(bin, key, value) {
    let qs = this.queryString(bin, key);
    this.cache[qs] = value;
    LS.setItem(qs, JSON.stringify(value));
  }

  get(bin, key) {
    if (key === undefined)
      return this.queryAll(bin);
    else
      return this.query(bin, key);
  }

  query(bin, key) {
    return this.cache[this.queryString(bin, key)];
  }

  queryAll(bin) {
    return Object.keys(LS).filter(
      wholeKey => new RegExp('^' + bin + sep).test(wholeKey)
    ).map(wholeKey => this.cache[wholeKey]);
  }

}
