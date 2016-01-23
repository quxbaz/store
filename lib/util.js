export function deepSet(obj, keys, val) {
  if (typeof keys === 'string')
    return deepSet(obj, keys.split('.'), val);
  let current = obj;
  for (var i=0; i < keys.length-1; i++) {
    let key = keys[i];
    if (!current.hasOwnProperty(key))
      current[key] = {};
    current = current[key];
  }
  current[keys[i]] = val;
  return obj;
}

export function clearLS() {
  Object.keys(localStorage).forEach(key => delete localStorage[key]);
}

export let byId = record => record.state.id == id;

// http://stackoverflow.com/a/8809472/376590
export function uuid() {
  let d = Date.now();
  if (window.performance && typeof window.performance.now === "function")
    d += performance.now();  // Use high-precision timer if available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r&0x3|0x8)).toString(16);
  });
}
