import Store from 'lib/store';
import Record from 'lib/record';
import LSAdapter from 'lib/adapters/ls/adapter';
import Model from 'lib/model';
import {attr, hasOne, hasMany, belongsTo} from 'lib/relations';

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
    let create = (...args) => () => new Model(...args);
    it("@url needs to end and begin with a slash.", () => {
      create('cat', {url: 'cats/'}).should.throw();
      create('cat', {url: '/cats'}).should.throw();
      create('cat', {url: 'c/at/s'}).should.throw();
      create('cat', {url: '/cats/'}).should.not.throw();
    });
  });

  describe("relations", () => {

    beforeEach(() => {
      store.define('zoo', {
        schema: {
          id: attr(),
          cats: hasMany('cat'),
          city: attr()
        }
      });
      store.define('cat', {
        schema: {
          id: attr(),
          name: attr(),
          zoo: belongsTo('zoo')
        }
      });
      server.bin.set('/zoo/1', {id: 1, city: 'chicago'});
      server.bin.set('/cat/2', {id: 2, zoo: 1, name: 'mittens'});
      server.bin.set('/cat/3', {id: 3, zoo: 1, name: 'whiskers'});
    });

    describe("defining models", () => {
      it("Throws an error on defining a relation that is not a Relation object.", () => {
        (() => {
          store.define('beehive', {
            schema: {
              bees: 'bees'
            }
          });
        }).should.throw();
      });
      it("Creates specifies a custom Record class.", () => {
        class CustomRecord extends Record {}
        store.define('custom', {RecordClass: CustomRecord});
        (store.Custom.create({}) instanceof CustomRecord)
          .should.be.true;
      });
    });

    describe("schema", () => {
      it("Throws an error on attempting to get a schema relation that does not exist.", () => {
        return store.get('zoo', 1).then((zoo) => {
          (() => {
            zoo.get('foo');
          }).should.throw();
        });
      });
      describe("model.hasManyAttrs()", () => {
        it("Return a list of hasMany schema attributes.", () => {
          store.define('novel');
          let {novel} = store.models;
          novel.hasManyAttrs().should.eql([]);
          novel.schema.chapters = hasMany('chapter');
          novel.hasManyAttrs().should.eql(['chapters']);
          novel.schema.titles = hasMany('titles');
          novel.hasManyAttrs().should.eql(['chapters', 'titles']);
        });
      });
    });

    describe("fetching", () => {
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
        let zoo = store.create('zoo', {city: 'bronx'});
        return store.create('cat', {
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
        let a = store.create('cat', {zoo: 1, name: 'a'});
        let b = store.create('cat', {zoo: 1, name: 'b'});
        let c = store.create('cat', {zoo: 1, name: 'c'});
        return store.get('zoo', 1).then(
          zoo => zoo.get('cats')
        ).then((cats) => {
          cats.map(cat => cat.state.name).sort()
            .should.eql(['a', 'b', 'c']);
        })
      });
      it("Gets saved and unsaved hasMany records.", () => {
        let yowzers = store.create('cat', {zoo: 1, name: 'yowzers'});
        return store.get('zoo', 1).then(
          () => yowzers.get('zoo')
        ).then(
          zoo => zoo.get('cats')
        ).then((cats) => {
          let names = cats.map(cat => cat.state.name);
          names.sort().should.eql(['mittens', 'whiskers', 'yowzers']);
        });
      });
    });

    describe("persistence", () => {
      it("Defines a belongsTo relationship by passing the record directly.", () => {
        let zoo = store.create('zoo');
        let cat = store.create('cat', {zoo});
        cat.state.zoo.should.eql(zoo.cid);
      });
      it("Does not call store.saveRecord() if the record is not dirty.", () => {
        let cat = store.create('cat');
        return cat.save().then((data) => {
          store.saveRecord = () => {
            throw new Error('This should not have been thrown.');
          };
          return cat.save();
        });
      });
      it("Does not strip a belongsTo schema relation if the record is persisted.", () => {
        let zoo = store.create('zoo', {city: 'berlin'});
        let cat = store.create('cat');
        return zoo.save().then((data) => {
          cat.setState({zoo: data.id});
          cat.toJSON().should.eql({
            zoo: data.id
          });
        });
      });
      it("Strips the belongsTo schema relation if the record has not been persisted.", () => {
        let zoo = store.create('zoo', {city: 'berlin'})
        let brambles = store.create('cat', {
          zoo: zoo.cid,
          name: 'brambles'
        });
        brambles.toJSON().should.eql({name: 'brambles'});
      });
      it("Convert cid relations to id values when saving unpersisted records.", () => {
        let zoo = store.create('zoo');
        let salty = store.create('cat', {
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
        let zoo = store.create('zoo');
        let cat = store.create('cat', {zoo: zoo.cid});
        return zoo.get('cats').then((cats) => {
          cats[0].should.eql(cat);
        });
      });
      it("Sets a hasMany record's belongTo relation to undefined and does not count it as a reference.", () => {
        let zoo = store.create('zoo');
        let cat = store.create('cat', {zoo: zoo.cid});
        return zoo.get('cats').then((cats) => {
          cats[0].should.eql(cat);
          cat.state.zoo = undefined;
          return zoo.get('cats');
        }).then((cats) => {
          cats.should.eql([]);
        });
      });
    });

    describe("record.destroy()", () => {
      it("Does nothing when destroying an unpersisted record.", () => {
        let cat = store.create('cat');
        return cat.destroy();
      });
    });

    describe("record.toJSON()", () => {
      it("Does not include properties in .toJSON() if the property is not defined in its schema.", () => {
        store.define('robot', {
          schema: {
            name: attr(),
            weapon: attr()
          }
        });
        let robot = store.create('robot', {
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
        let zoo = store.create('zoo', {
          cats: 'will be stripped',
          city: 'berlin'
        });
        zoo.toJSON().should.eql({
          city: 'berlin'
        });
      });
    });

    describe("record.belongsTo()", () => {
      it("Returns true if a record belongs to another.", () => {
        let zoo = store.create('zoo');
        let cat = store.create('cat', {zoo: zoo.cid});
        cat.belongsTo(zoo).should.be.true;
      });
      it("Invokes by id.", () => {
        let zoo = store.create('zoo', {id: 1});
        let cat = store.create('cat', {zoo: zoo.state.id});
        cat.belongsTo(zoo).should.be.true;
      });
      it("Returns false if a record does not belong to another.", () => {
        let zoo = store.create('zoo');
        let cat = store.create('cat');
        cat.belongsTo(zoo).should.be.false;
      });
    });

    describe("hasOne relation", () => {
      beforeEach(() => {
        store.define('house', {
          schema: {
            id: attr()
          }
        });
        store.define('dog', {
          schema: {
            id: attr(),
            name: attr(),
            house: hasOne('house')
          }
        });
      });
      it("Creates records of a hasOne relation.", () => {
        let house = store.create('house');
        let dog = store.create('dog', {house});
        return dog.get('house').then((house) => {
          house.should.eql(house);
        });
      });
      it("Creates a hasOne relation using ids.", () => {
        let house = store.create('house');
        let dog = store.create('dog', {house});
        return house.save().then(
          () => dog.save()
        ).then(() => {
          dog.toJSON().house.should.eql(house.state.id);
        });
      });
    });

    describe("record.validateState()", () => {
      it("Calls validateState() as part of setState().", () => {
        let cat = store.create('cat');
        cat.validateState = (state) => {
          return {name: 'newname'};
        };
        cat.setState({name: 'bubbles'});
        cat.state.name.should.eql('newname');
      });
      it("Returns a valid state as is.", () => {
        let cat = store.create('cat');
        cat.validateState({name: 'kip'}).should.eql({name: 'kip'});
      });
      it("Strips any non-schema properties.", () => {
        let cat = store.create('cat');
        cat.validateState({toy: 'ball'}).should.eql({});
        cat.validateState({name: 'kip', toy: 'ball'}).should.eql({name: 'kip'});
      });
      it("Strips hasMany properties.", () => {
        let zoo = store.create('zoo');
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

    describe("record.hasId()", () => {
      it("Returns true if a record matches its id or cid.", () => {
        let cat = store.Cat.create({id: 42});
        cat.hasId(cat.cid).should.be.true;
        cat.hasId(42).should.be.true;
        cat.hasId(999).should.be.false;
      });
    });

    describe("record.getId()", () => {
      it("Gets a record id or cid.", () => {
        let record = store.Cat.create();
        record.getId().should.eql(record.cid);
        record.setState({id: 'foo'});
        record.getId().should.eql('foo');
        record.setState({id: undefined});
        record.getId().should.eql(record.cid);
      });
    });

  });

  describe("record event emitter", () => {
    beforeEach(() => {
      store.define('book', {
        schema: {
          id: attr(),
          title: attr()
        }
      });
    });
    it("Triggers a change event on .setState()", () => {
      let book = store.create('book');
      let spy = 0;
      book.on('change', () => spy++);
      book.setState({title: 'animal farm'});
      spy.should.eql(1);
      book.setState({title: 'go dog go'});
      spy.should.eql(2);
    });
  });

  describe("Record constructor", () => {
    it("Creates a shallow copy of the state passed in.", () => {
      store.define('dog', {
        schema: {
          name: attr()
        }
      });
      let state = {name: 'spanky'};
      let dog = store.create('dog', state);
      dog.state.name.should.eql('spanky');
      state.name = 'barks';
      dog.state.name.should.eql('spanky');
    });
  });

  describe("default values", () => {
    it("Record instantiates with default values.", () => {
      store.define('bowl', {
        schema: {
          radius: attr(50),
          color: attr('grey'),
          pattern: attr()
        }
      });
      store.create('bowl').state.should.eql({
        radius: 50,
        color: 'grey'
      });
    });
    it("Provides a defaultValue function instead of a value.", () => {
      let spy = 0;
      store.define('armor', {
        schema: {
          count: attr(() => spy++)
        }
      });
      store.create('armor').state.count.should.eql(0);
      store.create('armor').state.count.should.eql(1);
    });
    it("Passes a state object into a defaultValue function.", () => {
      store.define('shirt', {
        schema: {
          material: attr(),
          condition: attr((state) => {
            if (state.material === 'silk')
              return 'good';
            return 'okay';
          })
        }
      });
      let cottonShirt = store.create('shirt', {material: 'cotton'});
      let silkShirt = store.create('shirt', {material: 'silk'});
      cottonShirt.state.condition.should.eql('okay');
      silkShirt.state.condition.should.eql('good');
    });
  });

});
