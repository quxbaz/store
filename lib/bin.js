/*
  bin.js

  A LocalStorage wrapper that supports sub-containers.

  <API>
  bin.get(bin, key)
  bin.set(bin, key, value)
  bin.all(bin)
*/


const LS = localStorage;

export default class Bin {

  constructor(options={}) {
    this.cache = {};
    // Cache all of localStorage up-front.
    Object.keys(LS).forEach((key) => {
      this.cache[key] = JSON.parse(LS.getItem(key));
    });
    this.sep = options.sep || '::';
    this.parser = options.parser;
  }

  set(bin, key, value) {
    if (value !== undefined) {
      let q = this.queryString(bin, key);
      this.cache[q] = value;
      LS.setItem(q, JSON.stringify(value));
    } else if (this.parser) {
      let parsed = this.parser(bin);
      return this.set(parsed.bin, parsed.key, key);  // @key should actually be called @value here.
    }
  }

  get(bin, key) {
    if (key !== undefined)
      return this.cache[this.queryString(bin, key)];
    else if (this.parser) {
      let parsed = this.parser(bin);
      return this.get(parsed.bin, parsed.key);
    }
  }

  all(bin) {
    return Object.keys(LS).filter(
      wholeKey => new RegExp('^' + bin + this.sep).test(wholeKey)
    ).map(wholeKey => this.cache[wholeKey]);
  }

  queryString(bin, key) {
    return bin + this.sep + key;
  }

}

/*
  Parses a url of the type /foo/bar/42 into:
    {
      bin: /foo/bar/,
      key: 42
    }
*/
Bin.URL_PARSER = (string) => {
  let key = /[^\/]*$/.exec(string)[0];
  let bin = string.slice(0, string.length - key.length);
  return {bin, key};
}
