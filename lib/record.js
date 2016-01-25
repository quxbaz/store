export default class Record {

  constructor(state={}, props) {
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
