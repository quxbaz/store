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
      // <TODO> Set props to correct type
      this.setState(data);
      return data;
    });
  }

  destroy() {
    return this.props.store.destroyRecord(this);
  }

}
