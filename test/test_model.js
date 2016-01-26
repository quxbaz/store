import Store from 'lib/store';
import LSAdapter from 'lib/adapters/ls/adapter';
import Model from 'lib/model';
import {hasMany, belongsTo} from 'lib/relations';

// Model factory function. Returns a function that returns a model.
let create = (...args) => {
  return () => {
    return new Model(...args);
  };
};

describe("lib/model", () => {

  let store;
  let adapter;
  let server;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LSAdapter();
    server = adapter.server;
    store = new Store({adapter});
  });

  describe("constructor", () => {
    it("@url needs to end and begin with a slash.", () => {
      create('cat', 'cats/').should.throw();
      create('cat', '/cats').should.throw();
      create('cat', 'c/at/s').should.throw();
      create('cat', '/cats/').should.not.throw();
    });
  });

  describe("relations", () => {

    beforeEach(() => {
      store.registerModel('zoo', '/zoo/', {
        cats: hasMany('cat')
      });
      store.registerModel('cat', '/cat/', {
        zoo: belongsTo('zoo')
      });
      server.bin.set('/zoo/1', {id: 1, city: 'chicago'});
      server.bin.set('/cat/2', {id: 2, zoo: 1, name: 'mittens'});
      server.bin.set('/cat/3', {id: 3, zoo: 1, name: 'whiskers'});
    });

    it("Throws an error on defining a relation that is not a Relation object.", () => {
      (() => {
        store.registerModel('Beehive', '/beehive/', {
          bees: 'bees'
        });
      }).should.throw();
    });

    it("Gets a record and its hasMany records.", () => {
      return store.get('zoo', 1).then((zoo) => {
        return zoo.get('cats');
      }).then((cats) => {
        cats.length.should.eql(2);
        cats.find(cat => cat.state.id === 2).state.name.should.eql('mittens');
        cats.find(cat => cat.state.id === 3).state.name.should.eql('whiskers');
      });
    });

    it("Gets a record's belongsTo records.", () => {
      return store.get('cat', 2).then((cat) => {
        return cat.get('zoo');
      }).then((zoo) => {
        zoo.state.city.should.eql('chicago');
      });
    });

    it("Keeps saved and unsaved hasMany records.", () => {
      let yowzers = store.createRecord('cat', {zoo: 1, name: 'yowzers'});
      return store.get('zoo').then(
        () => yowzers.get('zoo')
      ).then(
        zoo => zoo.get('cats')
      ).then((cats) => {
        let names = cats.map(cat => cat.state.name);
        names.sort().should.eql(['mittens', 'whiskers', 'yowzers']);
      });
    });

    it("Gets an unsaved belongsTo record.", () => {
      false.should.eql(true);
      let zoo = store.createRecord('zoo', {city: 'bronx'});
      return store.createRecord('cat', {
        zoo: zoo.cid,
        name: 'baggage'
      }).get('zoo').then((record) => {
        record.state.city.should.eql('bronx');
        record.should.eql(zoo);
      });
    });

    it("Strips the belongsTo relation if the record has not been persisted.", () => {
      let zoo = store.createRecord('zoo', {city: 'berlin'})
      let brambles = store.createRecord('cat', {
        zoo: zoo.cid,
        name: 'brambles'
      });
      brambles.saveData().should.eql({name: 'brambles'});
    });

  });

});
