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

  describe.only("relations", () => {

    beforeEach(() => {
      store.registerModel('zoo', '/zoo/', {
        cats: hasMany('cat')
      });
      store.registerModel('cat', '/cat/', {
        zoo: belongsTo('zoo')
      });
      server.bin.set('/zoo/1', {id: 1, city: 'chicago'});
    });

    it("Throws an error on defining a relation that is not a Relation object.", () => {
      (() => {
        store.registerModel('Beehive', '/beehive/', {
          bees: 'bees'
        });
      }).should.throw();
    });

    it("Gets a list of model-relations.", () => {
      store.registerModel('chain', '/chain/', {
        markets: hasMany('market')
      });
      store.registerModel('market', '/market/', {
        chain: belongsTo('chain')
      });
      store.getModelDeps('chain').should.eql(['chain', 'market']);
    });

    it("Gets a larger list of model-relations.", () => {
      store.registerModel('chain', '/chain/', {
        managers: hasMany('manager'),
        markets: hasMany('market')
      });
      store.registerModel('manager', '/manager/', {
        chain: belongsTo('chain')
      });
      store.registerModel('market', '/market/', {
        chain: belongsTo('chain'),
        items: hasMany('item')
      });
      store.registerModel('item', '/item/', {
        market: belongsTo('market')
      });
      store.getModelDeps('chain').should.eql(['chain', 'manager', 'market', 'item']);
    });

    it("Gets a record and it's subrecords.", () => {
      let zoo_id = 1;
      server.bin.set('/cat/2', {zoo_id, name: 'mittens'});
      server.bin.set('/cat/3', {zoo_id, name: 'whiskers'});
      return store.get('zoo', 1).then((zoo) => {
        zoo.hasMany.cats.find(cat => cat.id === 2).state.name.should.eql('mittens');
        zoo.hasMany.cats.find(cat => cat.id === 3).state.name.should.eql('whiskers');
      });
    });

  });

});
