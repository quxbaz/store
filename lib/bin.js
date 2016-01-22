/*
  bin.js

  A LocalStorage wrapper that supports sub-containers.

  <API>
  bin.get(bin, key)
  bin.set(bin, key, value)
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
    if (key === undefined)
      return this.queryAll(bin);
    else
      return this.query(bin, key);
  }

  queryString(bin, key) {
    return bin + sep + key;
  }

  query(bin, key) {
    let q = this.queryString(bin, key);
    let resource = this.cache[q];
    if (resource === undefined) {
      resource = JSON.parse(LS.getItem(q));
      this.cache[q] = resource;
    }
    return resource;
  }

  queryAll(bin) {
    return Object.keys(LS).filter(
      wholeKey => new RegExp('^' + bin + sep).test(wholeKey)
    ).map((wholeKey) => {
      // Extracts just the part after the separator
      let key = new RegExp(sep + '(.*)').exec(wholeKey)[1];
      return this.query(bin, key);
    });
  }

}
