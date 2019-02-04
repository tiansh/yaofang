; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const storage = yawf.storage = {};

  class StorageWatcher {
    constructor(area) {
      /** @type {Object<string, Map<string, Set<Function>>>} */
      this.watcher = { local: new Map(), sync: new Map() };
      browser.storage.onChanged.addListener((changes, area) => {
        const watcher = this.watcher[area];
        Object.keys(changes).forEach(key => {
          if (!watcher.has(key)) return;
          const { oldValue, newValue } = changes[key];
          watcher.get(key).forEach(callback => {
            try {
              callback(newValue, oldValue);
            } catch (e) {
              util.debug('Error while invoke storage watcher %s.%s -> %o:\n%o', area, key, callback, e);
            }
          });
        });
      });
    }
    /**
     * @param {StorageItem} storage
     * @param {Function} callback
     */
    addListener(storage, callback) {
      const watcher = this.watcher[storage.area];
      if (!watcher.has(storage.key)) watcher.set(storage.key, new Set());
      watcher.get(storage.key).add(callback);
      const removeListener = function () {
        if (!watcher.has(storage.key)) return false;
        const callbacks = watcher.get(storage.key);
        const result = callbacks.delete(callback);
        if (callbacks.size === 0) watcher.delete(storage.key);
        return result;
      };
      return { removeListener };
    }
  }

  const watcher = new StorageWatcher();

  class StorageItem {
    /**
     * @param {string} key
     * @param {boolean} isLocal
     */
    constructor(key, isLocal = false) {
      this.area = isLocal ? 'local' : 'sync';
      this.key = key;
      this.last = Promise.resolve();
    }
    async run(callback) {
      this.last = this.last.then(callback).then(value => value, error => {
        util.debug('Error while handling storage: %o', error);
      });
      return this.last;
    }
    async get() {
      const results = await this.run(() => (
        browser.storage[this.area].get(this.key)
      ));
      return results[this.key];
    }
    /** @param {*} value */
    async set(value) {
      await this.run(() => (
        browser.storage[this.area].set({ [this.key]: value })
      ));
    }
    async remove() {
      await this.run(() => (
        browser.storage[this.area].remove(this.key)
      ));
    }
    /** @param {Function} callback */
    addListener(callback) {
      return watcher.addListener(this, callback);
    }
  }

  const storageBuilder = storage.Storage = function (key, isLocal = false) {
    return new StorageItem(key, isLocal);
  };

  class ConfigCollection {
    /**
     * @param {StorageItem} storage
     */
    constructor(storage) {
      this.storage = storage;
      /** @type {Map<string, Set<Function>>} */
      this.watcher = new Map();
      this.initialized = false;
    }
    triggerOnChanged(key, newValue, oldValue) {
      const callbacks = this.watcher.get(key);
      if (!callbacks || !callbacks.size) return;
      const clonedNewValue = newValue && JSON.parse(JSON.stringify(newValue));
      const clonedOldValue = oldValue && JSON.parse(JSON.stringify(oldValue));
      callbacks.forEach(callback => {
        try {
          callback(clonedNewValue, clonedOldValue);
        } catch (e) {
          util.debug('Error while call config onchange callback: %o, %s [%o, %o]', this.storage, key, clonedNewValue, clonedOldValue);
        }
      });
    }
    async init() {
      if (this.initialized) return;
      this.initialized = true;
      while (true) {
        this.value = await this.storage.get();
        if (typeof this.value === 'object') break;
        await this.storage.set({});
      }
      this.storage.addListener(newValues => {
        const values = this.value;
        const keys = new Set(Object.keys(values).concat(Object.keys(newValues)));
        keys.forEach(key => {
          const strNewValue = newValues[key] === void 0 ? void 0 : JSON.stringify(newValues[key]);
          const oldValue = values[key];
          const strOldValue = oldValue === void 0 ? void 0 : JSON.stringify(oldValue);
          if (strNewValue === strOldValue) return;
          values[key] = strNewValue && JSON.parse(strNewValue);
          this.triggerOnChanged(key, newValues[key], oldValue);
        });
      });
    }
    /** @param {string} key */
    get(key) {
      if (!this.initialized) throw Error('Config should initialized first');
      return this.value[key] && JSON.parse(JSON.stringify(this.value[key]));
    }
    /**
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      if (!this.initialized) throw Error('Config should initialized first');
      const values = this.value;
      const oldValue = values[key];
      const strOldValue = oldValue === void 0 ? void 0 : JSON.stringify(oldValue);
      const strNewValue = value === void 0 ? void 0 : JSON.stringify(value);
      if (strNewValue !== strOldValue) {
        if (strNewValue) values[key] = JSON.parse(strNewValue);
        else delete values[key];
        const set = this.storage.set(values);
        set.then(() => {
          this.triggerOnChanged(key, value, oldValue);
        });
      }
      return strNewValue && JSON.parse(strNewValue);
    }
    /** @param {string} key */
    remove(key) {
      return this.set(key, void 0);
    }
    /**
     * @param {string} key
     * @param {Function} callback
     */
    addListener(key, callback) {
      const watcher = this.watcher;
      if (!watcher.has(key)) watcher.set(key, new Set());
      watcher.get(key).add(callback);
      const removeListener = function () {
        if (!watcher.has(key)) return false;
        const callbacks = watcher.get(key);
        const result = callbacks.delete(callback);
        if (callbacks.size === 0) watcher.delete(key);
        return result;
      };
      return { removeListener };
    }
    /** @param {string} key */
    key(key) {
      return new ConfigKey(this, key);
    }
  }

  class ConfigKey {
    /**
     * @param {ConfigCollection} config
     * @param {string} key
     */
    constructor(config, key) {
      this.config = config;
      this.key = key;
    }
    get() { return this.config.get(this.key); }
    set(value) { return this.config.set(this.key, value); }
    remove() { return this.config.remove(this.key); }
    addListener(callback) {
      return this.config.addListener(this.key, callback);
    }
  }

  const configBuilder = storage.Config = function (storage) {
    return new ConfigCollection(storage);
  };

}());
