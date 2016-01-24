export class Relation {
  constructor(relation, modelName) {
    this.relation = relation;  // ['hasMany', 'belongsTo']
    this.modelName = modelName;
  }
}

export let hasMany = (modelName) => {
  return new Relation('hasMany', modelName);
};

export let belongsTo = (modelName) => {
  return new Relation('belongsTo', modelName);
};
