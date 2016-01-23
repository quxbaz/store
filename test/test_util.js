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
    it.skip("Generates 10,000 random ids.", () => {
      let ids = new Set();
      for (let i=0; i < 10000; i++)
        ids.add(util.uuid());
      ids.size.should.eql(10000);
    });
  });

});
