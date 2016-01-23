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

});
