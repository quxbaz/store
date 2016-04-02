import Stateful from 'stateful';
import {values, id, cid, without, hasId} from './util';

export default class Record extends Stateful {

  constructor(state={}, props) {
    super(state);
    this.cid = cid();
    this.props = props;
    this.isDirty = true;
    this.setState(state);
  }

  hasId(id) {
    return hasId(this, id);
  }

  getId() {
    return this.state.id || this.cid;
  }

  setState(state) {
    let changed = super.setState(state, true);
    if (changed) {
      this.isDirty = true;
      this.trigger('change');
    }
  }

  validateState(state) {
    let validState = Object.assign({}, state);
    let schema = this.props.model.schema;
    for (let attr of Object.keys(state)) {

      // Delete the property if it doesn't exist in the schema or if
      // attempting to set on a hasMany attribute
      if (!schema.hasOwnProperty(attr) || schema[attr].type === 'hasMany')
        delete validState[attr];

      // Convert record values to id/cid
      else if (state[attr] instanceof Record) {
        let record = state[attr];
        validState[attr] = record.getId()
      }

    }
    return validState;
  }

  save(state) {
    if (state !== undefined)
      this.setState(state);
    if (!this.isDirty)
      return Promise.resolve({});
    return this.props.store.saveRecord(this).then((data) => {
      this.setState(data);
      this.isDirty = false;
      return data;
    });
  }

  isValidAttr(attr) {
    /*
      Returns true if the attribute exists in the schema and relations
      reference persistent records.
    */
    let {schema} = this.props.model;
    let {store} = this.props;
    let val = this.state[attr];

    if (!schema.hasOwnProperty(attr))
      return false;

    let conds = [
      schema[attr].type !== 'hasMany'
    ];

    // Check if the relation refers to a persisted record.
    if (schema[attr].isId()) {
      let record = store.get(attr, val, true);
      conds.push(record.state.id !== undefined);
    }

    return conds.every(cond => cond);
  }

  toJSON() {
    /*
      Returns @state stripped of invalid entries and non-persisted
      records.
    */
    let {schema} = this.props.model;
    let {store} = this.props;

    let json = {};
    let valid = Object.keys(this.state)
      .filter((attr) => this.isValidAttr(attr));

    valid.forEach((attr) => {
      json[attr] = this.state[attr];
      if (schema[attr].isId()) {
        let val = this.state[attr];
        let record = store.get(attr, val, true);
        if (val === record.cid)
          json[attr] = record.state.id;
      }
    });

    return json;
  }

  destroy() {
    return this.props.store.destroyRecord(this);
  }

  _get(attr, sync=false) {
    let {schema, name} = this.props.model;
    if (schema[attr] === undefined)
      throw new Error('Schema relation @' + attr + ' does not exist.');
    let relation = schema[attr];
    if (relation.isId()) {
      let targetId = this.state[attr];
      return this.props.store.get(relation.modelName, targetId, sync);
    }
    else if (relation.type === 'hasMany') {
      let result = this.props.store.all(relation.modelName, sync);
      let filter = (records) => records.filter(record => record.belongsTo(this));
      if (sync)
        return filter(result);
      else
        return result.then(filter);
    }
  }

  get(attr) {
    /*
      For getting [hasOne, hasMany, belongsTo] records. Always returns a
      promise.
    */
    return this._get(attr);
  }

  take(attr) {
    /*
      Like .get(), but works synchronously. Related records must be
      cached for this to work as intended.
    */
    return this._get(attr, true);
  }

  belongsTo(record) {
    let attr = record.props.model.name;
    return hasId(record, this.state[attr]);
  }

}
