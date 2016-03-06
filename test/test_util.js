import * as util from 'lib/util';

describe("lib/util", () => {

  describe("uuid()", () => {
    it("Generates 10,000 random ids.", () => {
      let ids = new Set();
      for (let i=0; i < 10000; i++)
        ids.add(util.uuid());
      ids.size.should.eql(10000);
    });
  });

  describe("each()", () => {
    it("Iterates through an object.", () => {
      let o = {
        a: 1,
        b: 2,
        c: 3
      };
      let sumVal = 0;
      let sumKey = '';
      util.each(o, (val, key) => {
        sumVal += val;
        sumKey += key;
      });
      sumVal.should.eql(6);
      sumKey.split('').sort().join('').should.eql('abc');
    });
    it("Exits early.", () => {
      let o = {
        a: 1,
        b: 2,
        c: 3
      };
      let sum = 0;
      util.each(o, (val, key) => {
        sum += val;
        return false;
      });
      (sum <= 3).should.be.true;
    });
  });

  describe("without()", () => {
    it("Removes keys from an object.", () => {
      util.without({a:1, b:2, c:3}, 'c').should.eql({a:1, b:2})
      util.without({a:1, b:2, c:3}, ['a']).should.eql({b:2, c:3})
      util.without({a:1, b:2, c:3}, ['a', 'b']).should.eql({c:3})
      util.without({a:1, b:2, c:3}, ['a', 'b', 'c']).should.eql({})
    });
  });

  describe("cid()", () => {
    it("Creates 1000 unique cids that all begin with 'c'", () => {
      let cids = new Set();
      for (let i=0; i < 1000; i++)
        cids.add(util.cid());
      cids.size.should.eql(1000);
      for (let cid of cids)
        cid[0].should.eql('c');
    });
  });

  describe("hasId()", () => {
    it("It tests if a function has an undefined id.", () => {
      let record = {state: {}};
      util.hasId(record, 1).should.be.false;
    });
    it("It tests if a function has an id.", () => {
      let record = {state: {id: 1}};
      util.hasId(record, 2).should.be.false;
      util.hasId(record, 1).should.be.true;
    });
    it("It tests if a function has a cid.", () => {
      let record = {cid: 1, state: {}};
      util.hasId(record, 2).should.be.false;
      util.hasId(record, 1).should.be.true;
    });
  });

  describe("byId()", () => {
    let byId = util.byId;
    it("Always returns false on providing undefined for id.", () => {
      byId()().should.eql(false);
      byId(undefined)().should.eql(false);
    });
    it("Finds a record by id.", () => {
      let records = [
        {state: {id: 1}},
        {state: {id: 2}}
      ];
      records.find(byId(1)).should.eql(records[0]);
      byId(1)(records[0]).should.be.true
    });
    it("Finds a record by cid.", () => {
      let records = [
        {cid: 'a', state: {id: 1}},
        {cid: 'b', state: {id: 2}}
      ];
      records.find(byId('b')).should.eql(records[1]);
      byId('b')(records[1]).should.be.true
    });
  });

  describe("capitalize()", () => {
    it("Does nothing when passed an empty string.", () => {
      util.capitalize('').should.eql('');
    });
    it("Capitalizes a single letter.", () => {
      util.capitalize('a').should.eql('A');
    });
    it("Capitalizes a string.", () => {
      util.capitalize('foo').should.eql('Foo');
    });
    it("Capitalizes only the first character of a multi-word string..", () => {
      util.capitalize('foo foo').should.eql('Foo foo');
    });
  });

  describe("value()", () => {
    it("Gets the values of an object.", () => {
      util.values({}).should.eql([]);
      util.values({a:1}).should.eql([1]);
      util.values({a:1, b:2}).should.eql([1, 2]);
    });
  });

});
