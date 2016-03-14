# store


## Basic Usage


First import everything you need:
```javascript
import store from 'store';
import {attr, belongsTo, hasMany} from 'store/lib/relations';
```


Define models:
```javascript
store.define('zoo', {
  schema: {
    id: attr(),
    cats: hasMany('cat')
  }
});

store.define('cat', {
  schema: {
    id: attr(),
    name: attr(),
    zoo: belongsTo('zoo')
  }
});
```


Instantiate records:
```javascript
let chicagoZoo = store.Zoo.create({
  city: 'chicago'
});

let tiger = store.Cat.create({
  zoo: chicagoZoo
});
```


Save records:
```javascript
zoo.save();
```


Mutate records:
```javascript
tiger.setState({name: 'Tigger'});
```


Destroy records:
```javascript
tiger.destroy();
```


Listen to changes.
```javascript
tiger.on('change', (state) => {
  console.log(state);
});

// Triggers a change event with the new state.
tiger.setState({
  name: 'Whiskers'
});
```


Retrieve records:
```javascript
// Get a single cat record given an id.
store.Cat.get(<id>)

// Get all cat records.
store.Cat.all()

// Get a single record. Rejects if 0 or > 1 records are found.
store.Cat.one()

// Always get a single record. Creates a record if none exist. Rejects
// with an error if multiple records are found.
store.Cat.alwaysOne()
```


### Advanced Usage


Create custom record classes:
```javascript
im port Record from 'store/lib/record';

class Tabby extends Record {
  meow() {
    return 'Meow';
  }
}

store.define('tabby', {
  *RecordClass: Tabby*,
  schema: {...}
});
```


Validate record state:
```javascript
// Does not pass validation. "hasMany" attributes cannot be set directly.
zoo.setState({
  cats: 'foobar'
});

zoo.state.cats === undefined   // -> true

// Color is not defined in model.
zoo.setState({color: 'blue'});
zoo.state.color === undefined  // -> true
```


Specify custom state validation:
```javascript
class Bengal extends Record {
  validateState(state) {
    if (name != 'sammy')
      throw new Error('My name MUST be sammy!');
    else
      return state;
  }
}
```


store comes with a LocalStorage adapter. Here's how to use it:
```javascript
import store from 'store';
import LSAdapter from 'store/lib/adapters/ls/adapter';

// store will fetch and save from localStorage.
let store = new Store({
  adapter: new LSAdapter()
});
```