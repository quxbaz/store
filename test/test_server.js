import Bin from 'lib/bin';
import Server from 'lib/adapters/ls/server';

describe("lib/adapters/server", (done) => {

  let server;

  beforeEach(() => {
    localStorage.clear();
    server = new Server({parser: Bin.URL_PARSER});
  });

  describe("routes requests properly.", () => {
    let x;
    beforeEach(() => {
      x = 0;
    });
    it("routes to GET", () => {
      server.get = () => x++;
      server.request('/foo', {type: 'GET'});
      x.should.eql(1);
    });
    it("routes to POST", () => {
      server.post = () => x++;
      server.request('/foo', {type: 'POST'});
      x.should.eql(1);
    });
    it("routes to PUT", () => {
      server.put = () => x++;
      server.request('/foo', {type: 'PUT'});
      x.should.eql(1);
    });
    it("routes to DELETE", () => {
      server.delete = () => x++;
      server.request('/foo', {type: 'DELETE'});
      x.should.eql(1);
    });
    it("throws an error on omitting a type.", () => {
      (() => {
        server.request('/foo');
      }).should.throw();
    });
  });

  describe("get", () => {
    it("Gets a resource from localStorage.", () => {
      server.bin.set('/route/', 1, {name: 'foobar'});
      return server.get('/route/1').then((data) => {
        data.should.eql({name: 'foobar'});
      });
    });
    it("Rejects with an error when requesting an empty resource.", () => {
      return server.get('/foo').then(undefined, (error) => {
        error.slice(0, 5).should.eql('Error');
      });
    });
  });

  describe("post", () => {
    it("It persists an object.", () => {
      return server.post('/foo/bar/', {a: 'foo', b: 'bar'}).then((data) => {
        server.bin.get('/foo/bar/', data.id).should.eql({
          id: data.id,
          a: 'foo',
          b: 'bar'
        });
      });
    });
    it("Overwrites an existing resource.", () => {
      return server.post('foo/bar', {a: 'foo'}).then(() => {
        return server.post('foo/bar', {b: 'bar'});
      }).then((data) => {
        server.bin.get('foo/bar', data.id).should.eql({
          id: data.id,
          b: 'bar'
        });
      });
    });
  });

  describe("put", () => {
    it("Updates an existing resource.", () => {
      server.bin.set('/person/1', {name: 'bob', age: 'old'});
      return server.put('/person/1', {name: 'frank'}).then((data) => {
        data.name.should.eql('frank');
        data.age.should.eql('old');
        server.bin.all('/person/')[0].should.eql({
          name: 'frank',
          age: 'old'
        });
      });
    });
    it("Rejects with an error when the resource doesn't exist.", () => {
      return server.put('wabababa').then(undefined, (error) => {
        error.slice(0, 5).should.eql('Error');
      });
    });
  });

  describe("delete", () => {
    it("Deletes a resource", () => {
      server.bin.set('/person/2', {name: 'boogers'});
      return server.delete('/person/2').then(() => {
        (server.bin.get('/person/2') === undefined).should.be.true;
        localStorage.length.should.eql(0);
      });
    });
    it("Rejects with an error when the resource doesn't exist.", () => {
      return server.delete('person/3').then(undefined, (error) => {
        error.slice(0, 5).should.eql('Error');
      });
    });
  });

});
