import Store from 'lib/store';
import LSAdapter from 'lib/adapters/ls/adapter';
import {attr} from 'lib/relations';

describe("lib/store", () => {

  let store;
  let adapter;
  let server;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LSAdapter();
    server = adapter.server;
    store = new Store({adapter});
    store.registerModel('person', '/person/', {
      name: attr(),
      age: attr()
    });
  })

  it("Throws an error on not providing an adapter.", () => {
    (() => new Store()).should.throw();
  });

  it("Saves a record.", () => {
    let bob = store.createRecord('person', {
      name: 'bob',
      age: 42
    });
    return bob.save().then((data) => {
      bob.state.id.should.exist;
      bob.state.name.should.eql('bob');
      bob.state.age.should.eql(42);
      server.bin.all('/person/')[0].should.eql(bob.state);
    });
  });

  it("Updates a record.", () => {
    let bob = store.createRecord('person', {name: 'bob'});
    let id;
    return bob.save().then(() => {
      id = bob.state.id;
      return bob.save({name: 'big bob'});
    }).then(() => {
      (bob.state.id == id).should.be.true;
      bob.state.name.should.eql('big bob');
    });
  });

  it("Saves multiple records.", () => {
    let bob = store.createRecord('person', {name: 'bob'});
    let will = store.createRecord('person', {name: 'will'});
    return Promise.all([bob.save(), will.save()]).then(() => {
      bob.state.id.should.exist;
      will.state.id.should.exist;
      server.bin.get('/person/', bob.state.id).should.eql(bob.state);
      server.bin.get('/person/', will.state.id).should.eql(will.state);
    });
  });

  it("Fetches multiple records.", () => {
    return Promise.all([
      store.createRecord('person', {name: 'bob'}).save(),
      store.createRecord('person', {name: 'will'}).save()
    ]).then(() => {
      return store.all('person').then((persons) => {
        persons.length.should.eql(2);
        persons[0].state.name.should.eql('bob');
        persons[1].state.name.should.eql('will');
      });
    });
  });

  it("Does not cache a record if told explicitly told not to.", () => {
    let record = store.createRecord('person', {name: 'bob'}, false);
    store._cache.person.has(record).should.be.false;
  });

  describe(".get()", () => {
    it("Throws an error when calling with a non-existing model.", () => {
      (() => {store.get('Foobar')}).should.throw();
    });
    it("Throws an error when calling without an id.", () => {
      (() => store.get('person')).should.throw();
    });
    it("Fetches a single record.", () => {
      return server.post('/person/', {name: 'bob'}).then((data) => {
        return store.get('person', data.id);
      }).then((record) => {
        record.state.id.should.exist;
        record.state.name.should.eql('bob');
      });
    });
    it("Caches a fetched resource as a record.", () => {
      server.bin.set('/person/1', {id: 1, name: 'bob'});
      let compare;
      return store.get('person', 1).then((record) => {
        compare = record;
        return store.get('person', 1);
      }).then((record) => {
        (compare === record).should.be.true;
      });
    });
  });

  describe(".all()", () => {
    it("Throws an error when calling with a non-existing model.", () => {
      (() => {store.all('Foobar')}).should.throw();
    });
    it("Throws an error when calling with extra argument[s].", () => {
      (() => store.all('person', 1)).should.throw();
      (() => store.all('person', 1, 2)).should.throw();
    });
    it("Caches multiple records.", () => {
      server.bin.set('/person/1', {n: 1});
      server.bin.set('/person/2', {n: 2});
      server.bin.set('/person/3', {n: 3});
      let compare;
      return store.all('person').then((records) => {
        compare = records;
        return store.all('person');
      }).then((records) => {
        records.forEach((record, i) => {
          (record === compare[i]).should.be.true;
        });
      });
    });
    it("Caches any new records and persists pre-existing ones.", () => {
      // This record should be in the returned data set.
      let bob = store.createRecord('person', {name: 'bob'});
      server.bin.set('/person/2', {id: 2, name: 'yola'});
      server.bin.set('/person/3', {id: 3, name: 'gene'});
      return bob.save().then(() => {
        return store.all('person');
      }).then((records) => {
        records.includes(bob).should.be.true;
        return store.get('person', 2);
      }).then((yola) => {
        yola.state.should.eql({id: 2, name: 'yola'});
        return store.get('person', 3);
      }).then((gene) => {
        gene.state.should.eql({id: 3, name: 'gene'});
      });
    });
    it("Searches first in the cache instead of making request.", () => {
      let bob = store.createRecord('person', {name: 'bob'});
      let sam = store.createRecord('person', {name: 'sam'});
      return Promise.all([bob.save(), sam.save()]).then((dataList) => {
        return store.all('person');  // Should set .fetchedAll flag to true.
      }).then((records) => {
        records.should.eql([bob, sam]);
        bob.setState({name: 'bob1'});
        sam.setState({name: 'sam1'});
        // Adapter shouldn't be needed here because store should fetch from cache.
        store.props.adapter = undefined;
        return store.all('person');
      }).then((records) => {
        records.find(record => record.state.name == 'bob1').should.eql(bob);
        records.find(record => record.state.name == 'sam1').should.eql(sam);
      });
    });
    it("Processes an array argument.", () => {
      store.registerModel('foo', '/foo/');
      store.registerModel('bar', '/bar/');
      let foo = store.createRecord('foo', {name: 'foo'});
      let bar = store.createRecord('bar', {name: 'bar'});
      return Promise.all([
        foo.save(),
        bar.save()
      ]).then((lists) => {
        return store.all(['foo', 'bar']);
      }).then((lists) => {
        lists[0][0].should.eql(foo);
        lists[1][0].should.eql(bar);
      });
    });
  });

  describe(".one()", () => {
    it("Fetches a single model.", () => {
      server.bin.set('/person/1', {name: 'bob'});
      return store.one('person').then((record) => {
        record.state.name.should.eql('bob');
      });
    });
    it("Throws an error if more than one model is fetched.", (done) => {
      server.bin.set('/person/1', {name: 'bob'});
      server.bin.set('/person/2', {name: 'sam'});
      store.one('person').catch((error) => {
        done();
      });
    });
    it("Throws an error if zero models are fetched.", (done) => {
      store.one('person').catch((error) => {
        done();
      });
    });
  });

  describe(".destroyRecord()", () => {
    it("Deletes a record", () => {
      let bob = store.createRecord('person', {name: 'bob'});
      return bob.save().then(() => {
        return bob.destroy();
      }).then(() => {
        server.bin.all('/person/').should.eql([]);
      });
    });
    it("Deletes multiple records.", () => {
      let bob = store.createRecord('person', {name: 'bob'});
      let will = store.createRecord('person', {name: 'will'});
      return Promise.all([bob.save(), will.save()]).then(() => {
        return Promise.all([bob.destroy(), will.destroy()]);
      }).then(() => {
        server.bin.all('/person/').should.eql([]);
      });
    });
    it("Removes a record from the store cache and underlying datastore on destruction.", () => {
      let bob = store.createRecord('person', {name: 'bob'});
      return bob.save().then((data) => {
        store._cache['person'].size.should.eql(1);
        localStorage.length.should.eql(1);
        store.props.adapter = undefined;
        return store.get('person', data.id);
      }).then(() => {
        store.props.adapter = adapter;
        return bob.destroy();
      }).then(() => {
        store._cache['person'].size.should.eql(0);
        localStorage.length.should.eql(0);
      });
    });
  });

  describe(".cache()", () => {
    it("Caches a record and searches it by id.", () => {
      let record = store.createRecord('person', {id: 42});
      store.searchCache('person', 42).should.eql(record);
    });
    it("Searches a cached record by cid.", () => {
      let record = store.createRecord('person');
      store.searchCache('person', record.cid).should.eql(record);
    });
  });

  describe(".alwaysOne()", () => {
    it("Gets a record if it exists.", () => {
      server.bin.set('/person/1', {id: 1, name: 'bob'});
      return store.alwaysOne('person').then((record) => {
        record.state.should.eql({id: 1, name: 'bob'});
      });
    });
    it("Creates a record if it does not exist.", () => {
      return store.alwaysOne('person').then((record) => {
        record.should.exist;
      });
    });
    it("Throws an error on fetching multiple models.", (done) => {
      server.bin.set('/person/1', {name: 'bob'});
      server.bin.set('/person/2', {name: 'sam'});
      store.alwaysOne('person').catch((error) => {
        done();
      });
    });
  });

});
