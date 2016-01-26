import * as util from 'lib/util';

describe("lib/util", () => {

  describe("deepSet()", () => {
    it("Sets an object nested 1 level deep.", () => {
      util.deepSet({}, 'foo', 1).foo.should.eql(1);
      util.deepSet({}, ['foo'], 1).foo.should.eql(1);
    });
    it("Sets an object nested 2 levels deep.", () => {
      let obj = util.deepSet({}, ['foo', 'bar'], 1);
      obj.foo.bar.should.eql(1);
    });
    it("Sets an object nested 3 levels deep.", () => {
      let obj = util.deepSet({}, ['foo', 'bar', 'qux'], 1);
      obj.foo.bar.qux.should.eql(1);
    });
    it("Sets an object nested 4 levels deep.", () => {
      let obj = util.deepSet({}, ['foo', 'bar', 'qux', 'baz'], 1);
      obj.foo.bar.qux.baz.should.eql(1);
    });
    it("Sets an object using dot notation.", () => {
      let obj = util.deepSet({}, 'foo.bar.qux.baz', 1);
      obj.foo.bar.qux.baz.should.eql(1);
    });
  });

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
      console.log(sum);
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

});
