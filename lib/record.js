export default class Record {

  constructor(state={}, props) {
    this.state = state;
    this.props = props;

     // For storing hasMany-relationship records. These are not stored
     // in .state because it is controlled by subrecords, not the
     // record itself.
    this.hasMany = {};

    // For storing belongsTo-relationship records.
    this.belongsTo = [];
  }

  setState(state) {
    Object.assign(this.state, state);
  }

  save(state) {
    if (state !== undefined)
      this.setState(state);
    return this.props.store.saveRecord(this).then((data) => {
      // <TODO> Set props to correct type
      this.setState(data);
      return data;
    });
  }

  destroy() {
    return this.props.store.destroyRecord(this);
  }

}
