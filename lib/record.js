import {cid, without} from './util';

export default class Record {

  constructor(state={}, props) {
    this.cid = cid();
    this.state = state;
    this.props = props;
  }

  setState(state) {
    Object.assign(this.state, state);
  }

  save(state) {
    if (state !== undefined)
      this.setState(state);
    return this.props.store.saveRecord(this).then((data) => {
      this.setState(data);
      return data;
    });
  }

  saveData() {
    /*
      Akin to Backbone.Model.toJSON()
      This returns @state stripped of non-persisted records.

      <TODO> This also needs to convert cid relations to id values
      when dealing with newly persisted records.

    */
    let {schema} = this.props.model;
    let {store} = this.props;

    let toStrip = Object.keys(schema).map((attr) => {
      let {modelName} = schema[attr];
      if (schema[attr].type === 'belongsTo')
        return store.searchCache(modelName, this.state[modelName]);
    }).filter(
      record => !record.state.id
    ).map(
      record => record.props.model.name
    );

    return without(this.state, toStrip);
  }

  destroy() {
    return this.props.store.destroyRecord(this);
  }

  get(attr) {
    /*
      For getting [hasMany, belongsTo] records. Always returns a
      promise.
    */
    let {schema, name} = this.props.model;
    let relation = schema[attr];
    if (relation.type === 'belongsTo') {
      let targetId = this.state[relation.modelName];
      return this.props.store.get(relation.modelName, targetId);
    }
    else if (relation.type === 'hasMany') {
      return this.props.store.all(relation.modelName).then(
        records => records.filter(record => record.state[name] === this.state.id)
      );
    }
  }

}
