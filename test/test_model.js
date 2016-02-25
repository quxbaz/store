import Store from 'lib/store';
import LSAdapter from 'lib/adapters/ls/adapter';
import Model from 'lib/model';
import {attr, hasMany, belongsTo} from 'lib/relations';

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
    it("Throws an error on not providing a url.", () => {
      create('cat').should.throw();
    });
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
        id: attr(),
        cats: hasMany('cat'),
        city: attr()
      });
      store.registerModel('cat', '/cat/', {
        id: attr(),
        name: attr(),
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

    it("Throws an error on attempting to get a schema relation that does not exist.", () => {
      return store.get('zoo', 1).then((zoo) => {
        (() => {
          zoo.get('foo');
        }).should.throw();
      });
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

    it("Gets an unsaved belongsTo record.", () => {
      let zoo = store.createRecord('zoo', {city: 'bronx'});
      return store.createRecord('cat', {
        zoo: zoo.cid,
        name: 'baggage'
      }).get('zoo').then((record) => {
        record.state.city.should.eql('bronx');
        record.should.eql(zoo);
      });
    });

    it("Gets only unsaved hasMany records.", () => {
      localStorage.clear();
      server.bin.cache = {};
      server.bin.set('/zoo/1', {id: 1});
      let a = store.createRecord('cat', {zoo: 1, name: 'a'});
      let b = store.createRecord('cat', {zoo: 1, name: 'b'});
      let c = store.createRecord('cat', {zoo: 1, name: 'c'});
      return store.get('zoo', 1).then(
        zoo => zoo.get('cats')
      ).then((cats) => {
        cats.map(cat => cat.state.name).sort()
          .should.eql(['a', 'b', 'c']);
      })
    });

    it("Gets saved and unsaved hasMany records.", () => {
      let yowzers = store.createRecord('cat', {zoo: 1, name: 'yowzers'});
      return store.get('zoo', 1).then(
        () => yowzers.get('zoo')
      ).then(
        zoo => zoo.get('cats')
      ).then((cats) => {
        let names = cats.map(cat => cat.state.name);
        names.sort().should.eql(['mittens', 'whiskers', 'yowzers']);
      });
    });

    it("Does not strip a belongsTo schema relation if the record is persisted.", () => {
      let zoo = store.createRecord('zoo', {city: 'berlin'});
      let cat = store.createRecord('cat');
      return zoo.save().then((data) => {
        cat.setState({zoo: data.id});
        cat.toJSON().should.eql({
          zoo: data.id
        });
      });
    });

    it("Strips the belongsTo schema relation if the record has not been persisted.", () => {
      let zoo = store.createRecord('zoo', {city: 'berlin'})
      let brambles = store.createRecord('cat', {
        zoo: zoo.cid,
        name: 'brambles'
      });
      brambles.toJSON().should.eql({name: 'brambles'});
    });

    it("Convert cid relations to id values when saving unpersisted records.", () => {
      let zoo = store.createRecord('zoo');
      let salty = store.createRecord('cat', {
        name: 'salty',
        zoo: zoo.cid
      });
      return zoo.save().then((data) => {
        salty.toJSON().should.eql({
          name: 'salty',
          zoo: data.id
        });
      });
    });

    it("Gets unpersisted hasMany records from an unpersisted record.", () => {
      let zoo = store.createRecord('zoo');
      let cat = store.createRecord('cat', {zoo: zoo.cid});
      return zoo.get('cats').then((cats) => {
        cats[0].should.eql(cat);
      });
    });

    it("Sets a hasMany record's belongTo relation to undefined and does not count it as a reference.", () => {
      let zoo = store.createRecord('zoo');
      let cat = store.createRecord('cat', {zoo: zoo.cid});
      return zoo.get('cats').then((cats) => {
        cats[0].should.eql(cat);
        cat.state.zoo = undefined;
        return zoo.get('cats');
      }).then((cats) => {
        cats.should.eql([]);
      });
    });

    it("Detaches a belongsTo record.", () => {
      let zoo = store.createRecord('zoo');
      let cat = store.createRecord('cat', {zoo: zoo.cid});
      return zoo.get('cats').then((cats) => {
        cats[0].should.eql(cat);
        cat.detach('zoo');
        return zoo.get('cats');
      }).then((cats) => {
        cats.should.eql([]);
      });
    });

    it("Detaches a record by referencing the record.", () => {
      let zoo = store.createRecord('zoo');
      let a = store.createRecord('cat', {zoo: zoo.cid, name: 'a'});
      let b = store.createRecord('cat', {zoo: zoo.cid, name: 'b'});
      return zoo.get('cats').then((cats) => {
        cats.length.should.eql(2);
        a.detach(zoo);
        return zoo.get('cats');
      }).then((cats) => {
        cats.length.should.eql(1);
      });
    });

    it("Does not detach a record when referencing the correct Model, but the wrong record instance.", () => {
      let zoo = store.createRecord('zoo');
      let a = store.createRecord('cat', {zoo: zoo.cid, name: 'a'});
      let b = store.createRecord('cat', {zoo: zoo.cid, name: 'b'});
      return zoo.get('cats').then((cats) => {
        cats.length.should.eql(2);
        let otherZoo = store.createRecord('zoo');
        a.detach(otherZoo);
        return zoo.get('cats');
      }).then((cats) => {
        cats.length.should.eql(2);
      });
    });

    it("Attaches a record.", () => {
      let zoo = store.createRecord('zoo');
      let a = store.createRecord('cat', {name: 'a'});
      let b = store.createRecord('cat', {name: 'b'});
      a.attachTo(zoo);
      return zoo.get('cats').then((cats) => {
        (cats[0] === a).should.be.true;
      }).then(() => {
        b.attachTo(zoo);
        return zoo.get('cats');
      }).then((cats) => {
        (cats[0] === a).should.be.true;
        (cats[1] === b).should.be.true;
        a.detach('zoo');
        return zoo.get('cats');
      }).then((cats) => {
        (cats[0] === b).should.be.true;
      });
    });

    it("Does not include properties in .toJSON() if the property is not defined in its schema.", () => {
      store.registerModel('robot', '/robot/', {
        name: attr(),
        weapon: attr()
      });
      let robot = store.createRecord('robot', {
        name: 'mx2',
        weapon: 'cannons',
        year: 1911
      });
      robot.toJSON().should.eql({
        name: 'mx2',
        weapon: 'cannons'
      });
    });

    it("Strips hasMany attributes in .toJSON()", () => {
      let zoo = store.createRecord('zoo', {
        cats: 'will be stripped',
        city: 'berlin'
      });
      zoo.toJSON().should.eql({
        city: 'berlin'
      });
    });

    it("Does nothing when destroying an unpersisted record.", () => {
      let cat = store.createRecord('cat');
      return cat.destroy();
    });

    it("Does not call store.saveRecord() if the record is not dirty.", () => {
      let cat = store.createRecord('cat');
      return cat.save().then((data) => {
        store.saveRecord = () => {
          throw new Error('This should not have been thrown.');
        };
        return cat.save();
      });
    });

    describe("record.belongsTo()", () => {
      it("Returns true if a record belongs to another.", () => {
        let zoo = store.createRecord('zoo');
        let cat = store.createRecord('cat', {zoo: zoo.cid});
        cat.belongsTo(zoo).should.be.true;
      });
      it("Invokes by id.", () => {
        let zoo = store.createRecord('zoo', {id: 1});
        let cat = store.createRecord('cat', {zoo: zoo.state.id});
        cat.belongsTo(zoo).should.be.true;
      });
      it("Returns false if a record does not belong to another.", () => {
        let zoo = store.createRecord('zoo');
        let cat = store.createRecord('cat');
        cat.belongsTo(zoo).should.be.false;
      });
    });

    describe("record.validateState()", () => {
      it("Calls validateState() as part of setState().", () => {
        let cat = store.createRecord('cat');
        cat.validateState = (state) => {
          return {name: 'newname'};
        };
        cat.setState({name: 'bubbles'});
        cat.state.name.should.eql('newname');
      });
      it("Returns a valid state as is.", () => {
        let cat = store.createRecord('cat');
        cat.validateState({name: 'kip'}).should.eql({name: 'kip'});
      });
      it("Strips any non-schema properties.", () => {
        let cat = store.createRecord('cat');
        cat.validateState({toy: 'ball'}).should.eql({});
        cat.validateState({name: 'kip', toy: 'ball'}).should.eql({name: 'kip'});
      });
      it("Strips hasMany properties.", () => {
        let zoo = store.createRecord('zoo');
        zoo.validateState({cats: 'foobar'}).should.eql({});
        zoo.validateState({city: 'bronx', cats: 'foobar'}).should.eql({city: 'bronx'});
      });
    });

    describe("record.take()", () => {
      it("Gets related records synchronously.", () => {
        return store.all(['zoo', 'cat']).then(([zoo, cats]) => {
          cats[0].take('zoo').should.eql(zoo[0]);
          cats[1].take('zoo').should.eql(zoo[0]);
          zoo[0].take('cats').should.eql(cats);
        });
      });
      it("Throws an error on attempting to take an uncached belongsTo record.", () => {
        return store.get('cat', 2).then((cat) => {
          (() => {cat.take('zoo')}).should.throw();
        });
      });
      it("Throws an error on attempting to take an uncached hasMany record.", () => {
        return store.one('zoo').then((zoo) => {
          (() => {zoo.take('cats')}).should.throw();
        });
      });
    });

  });

  describe("record event emitter", () => {
    beforeEach(() => {
      store.registerModel('book', '/book/', {
        id: attr(),
        title: attr()
      });
    });
    it("Triggers a change event on .setState()", () => {
      let book = store.createRecord('book');
      let spy = 0;
      book.on('change', () => spy++);
      book.setState({title: 'animal farm'});
      spy.should.eql(1);
      book.setState({title: 'go dog go'});
      spy.should.eql(2);
    });
  });

});
