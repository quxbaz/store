import Store from 'lib/store';
import LSAdapter from 'lib/adapters/ls/adapter';

describe("lib/store", () => {

  let store;
  let adapter;
  let server;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LSAdapter();
    server = adapter.server;
    store = new Store({adapter});
    store.registerModel('person', '/person/');
  })

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

  it("Deletes a record", () => {
    let bob = store.createRecord('person', {name: 'bob'});
    return bob.save().then(() => {
      return bob.destroy();
    }).then(() => {
      server.bin.all('/person/').should.eql([]);
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

  it("Deletes multiple records.", () => {
    let bob = store.createRecord('person', {name: 'bob'});
    let will = store.createRecord('person', {name: 'will'});
    return Promise.all([bob.save(), will.save()]).then(() => {
      return Promise.all([bob.destroy(), will.destroy()]);
    }).then(() => {
      server.bin.all('/person/').should.eql([]);
    });
  });

  it("Fetches a single record.", () => {
    return server.post('/person/', {name: 'bob'}).then((data) => {
      return store.get('person', data.id);
    }).then((record) => {
      record.state.id.should.exist;
      record.state.name.should.eql('bob');
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

  it("Does not cache a record until it's saved.", () => {
    let record = store.createRecord('person', {name: 'bob'});
    store._cache.person.has(record).should.be.false;
    return record.save().then(() => {
      store._cache.person.has(record).should.be.true;
    });
  });

  it("Removes a record from the cache on destruction.", () => {
    // <TODO>
    false.should.be.true;
  });

  describe(".cache()", () => {
    it("Caches a record.", () => {
      let record = store.createRecord('person', {id: 42});
      store.cache(record);
      store.searchCache('person', 42).should.eql(record);
    });
  });

});
