/*
  Relation
*/

export class Relation {
  constructor(type, modelName, defaultValue) {
    this.type = type;  // ['hasMany', 'belongsTo']
    this.modelName = modelName;
    this.defaultValue = defaultValue;
  }
}

export let attr = (defaultValue) => new Relation('attr', undefined, defaultValue);
export let hasMany = (modelName) => new Relation('hasMany', modelName);
export let belongsTo = (modelName) =>  new Relation('belongsTo', modelName);
