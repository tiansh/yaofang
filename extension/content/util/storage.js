; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const storage = util.storage = {};

  const parseKey = key => {
    const isLocal = key.startsWith('_');
    const stripedKey = isLocal ? key.slice(1) : key;
    const area = isLocal ? 'local' : 'sync';
    return [area, stripedKey];
  };

  storage.get = async fullKey => {
    const [area, key] = parseKey(fullKey);
    const results = await browser.storage[area].get(key);
    return results[key];
  };

  storage.set = async (fullKey, value) => {
    const [area, key] = parseKey(fullKey);
    const keys = { [key]: value };
    await browser.storage[area].set(keys);
  };

  storage.remove = async fullKey => {
    const [area, key] = parseKey(fullKey);
    browser.storage[area].remove(key);
  };

  /** @type Map<string, Function[]> */
  const watcher = new Map();
  browser.storage.onChanged.addListener((changes, area) => {
    const prefix = area === 'local' ? '_' : '';
    Object.keys(changes).forEach(key => {
      const fullKey = prefix + key;
      const { oldValue, newValue } = changes[key];
      if (!watcher.has(fullKey)) return;
      watcher.get(fullKey).forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (e) {
          util.debug('Error while invoke storage watcher %s -> %o: %o', fullKey, callback, e);
        }
      });
    });
  });

  storage.watch = async (fullKey, callback) => {
    if (!watcher.has(fullKey)) {
      watcher.set(fullKey, []);
    }
    watcher.get(fullKey).push(callback);
  };

}());
