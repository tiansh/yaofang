; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const storage = yawf.storage = {};

  /**
   * 当设置项变化时给出针对某个设置的回调
   * 浏览器提供的接口会针对所有设置项给回调，但是我们显然只需要特定的设置项，所以包装一层
   */
  class StorageWatcher {
    constructor() {
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

  /**
   * 描述对应浏览器的一个设置项
   * 设置项的值总是一个对象，对象的不同键对应其他的含义
   */
  class StorageItem {
    /**
     * @param {string} key
     * @param {boolean} isLocal
     */
    constructor(key, isLocal = false) {
      this.area = isLocal ? 'local' : 'sync';
      this.key = key;
      this.last = Promise.resolve();
      this.processing = false;
      this.dirty = false;
      /** @type Array<Function> */
      this.watcher = [];
      watcher.addListener(this, newValue => {
        /*
         * 如果当前正有任何操作，那么这个 onChange 可能是我们自己触发的，
         * 而且有可能这个 onChange 还不是最新的（比如我们连续调用了几次 set，只有最后一次是有意义的）
         * 那么我们推迟 onChange 事件的发生，等到我们的数据写入完成之后，再读取最新的数据检查 onChange
         * 如果当前没有操作，那么说明 onChange 可能来自于其他页面
         * 这时候我们就可以放心大胆地触发 onChange 了
         */
        if (this.processing) {
          this.dirty = true;
          return;
        }
        this.onChange(newValue);
      });
    }
    async run(callback) {
      /*
       * 当执行异步操作时，我们首先标记 processing 以阻止 onChange
       * 接下来正常执行操作
       */
      this.processing = true;
      const last = this.last = this.last.then(callback).then(value => value, error => {
        util.debug('Error while handling storage: %o', error);
      });
      last.then(async () => {
        if (last !== this.last) return;
        /*
         * 回调有时候有延迟，所以我们过 5 秒再检查，可以过滤掉无效的回调
         * 并不是什么很好的解决办法，但是反正我也没找到更好的解决办法
         */
        await new Promise(resolve => setTimeout(resolve, 5000));
        /*
         * 如果标记位不是我们设置的，那么说明在此之后又调用了 run
         * 那么这个时候 processing 不应重置
         */
        if (last !== this.last) return;
        /*
         * 如果在写入过程中，有 onChange 回报回来，那么 dirty 被置位
         * 此时我们主动拉去一遍值来触发 onChange
         * 注意，此时 onChange 可能被无意义地触发了一次，所以需要在上一层过滤这种实际没变化的 onChange
         */
        this.processing = false;
        if (!this.dirty) return;
        const { [this.key]: value } = await browser.storage[this.area].get(this.key);
        /*
         * onChange 在 last 的流程内，会在结束前阻止任何后续操作
         */
        await this.onChange(value);
      });
      return this.last;
    }
    async onChange(value) {
      this.dirty = false;
      this.watcher.forEach(watcher => {
        try {
          watcher(value);
        } catch (e) {
          util.debug('Error while invoke stroage watcher: %o', e);
        }
      });
    }
    async get() {
      const results = await this.run(() => (
        browser.storage[this.area].get(this.key)
      ));
      return results[this.key];
    }
    /** @param {*} value */
    async set(value) {
      const token = this.lastSetToken = {};
      await this.run(() => {
        if (token !== this.lastSetToken) return null;
        this.lastSetToken = null;
        return browser.storage[this.area].set({ [this.key]: value });
      });
    }
    async remove() {
      await this.run(() => (
        browser.storage[this.area].remove(this.key)
      ));
    }
    /** @param {Function} callback */
    addListener(callback) {
      this.watcher.push(callback);
    }
  }

  storage.Storage = function (key, isLocal = false) {
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
          const newValue = newValues[key];
          const strNewValue = newValue === void 0 ? void 0 : JSON.stringify(newValue);
          const oldValue = values[key];
          const strOldValue = oldValue === void 0 ? void 0 : JSON.stringify(oldValue);
          if (strNewValue === strOldValue) return;
          values[key] = strNewValue === void 0 ? void 0 : JSON.parse(strNewValue);
          this.triggerOnChanged(key, strNewValue && JSON.parse(strNewValue), oldValue);
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
        this.storage.set(values);
        /*
         * 我们不必等值真的写入了，就可以触发 onChange
         * 这样会优化前端的渲染效果
         * 反正就算真的写挂了，我也没辙（摊手）
         */
        this.triggerOnChanged(key, value, oldValue);
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
    async import(data) {
      this.value = JSON.parse(JSON.stringify(data));
      await this.storage.set(this.value);
    }
    export() {
      return JSON.parse(JSON.stringify(this.value));
    }
    async reset() {
      await this.storage.set({});
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

  storage.Config = function (storage) {
    return new ConfigCollection(storage);
  };

}());

