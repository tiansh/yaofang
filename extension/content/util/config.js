; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const storage = util.storage;
  const config = util.config = {};

  const userConfig = {}, globalConfig = {};
  const onUserChange = new Map();
  const onGlobalChange = new Map();
  const triggerOnChange = (isGlobal, key, value) => {
    const onChange = isGlobal ? onGlobalChange : onUserChange;
    if (!onChange.has(key)) return;
    onChange.get(key).forEach(callback => {
      try {
        callback(value && JSON.parse(JSON.stringify(value)));
      } catch (e) {
        util.debug('config onchange callback failed %o: %o\n%o', key, callback, e);
      }
    });
  };

  const readConfig = isGlobal => {
    const config = isGlobal ? globalConfig : userConfig;
    return newValue => {
      const keys = Object.keys(newValue || {});
      keys.forEach(key => {
        const strValue = JSON.stringify(newValue[key]);
        if (JSON.stringify(config[key]) === strValue) return;
        config[key] = JSON.parse(strValue);
        triggerOnChange(isGlobal, key, config[key]);
      });
      Object.keys(config).forEach(key => {
        if (keys.includes(key)) return;
        delete config[key];
        triggerOnChange(isGlobal, key);
      });
    };
  };

  let writeGlobalConfig, writeUserConfig;

  config.init = async uid => {
    const userKey = `User${uid}Config`;
    const globalKey = `GlobalConfig`;
    const configs = await Promise.all([
      storage.get(userKey).then(readConfig(false)),
      storage.get(globalKey).then(readConfig(true)),
    ]);
    storage.watch(userKey, readConfig(false));
    storage.watch(globalKey, readConfig(true));
    writeGlobalConfig = async () => {
      await storage.set(globalKey, globalConfig);
    };
    writeUserConfig = async () => {
      await storage.set(userKey, userConfig);
    };
  };

  const parseKey = key => {
    const isGlobal = key.startsWith('$');
    const stripedKey = isGlobal ? key.slice(1) : key;
    const config = isGlobal ? globalConfig : userConfig;
    return [!!isGlobal, config, stripedKey];
  };

  config.get = fullKey => {
    const [isGlobal, selectedConfig, key] = parseKey(fullKey);
    return selectedConfig[key];
  };

  config.set = (fullKey, value) => {
    const [isGlobal, selectedConfig, key] = parseKey(fullKey);
    const strValue = JSON.stringify(value);
    if (JSON.stringify(selectedConfig[key]) === strValue) return;
    if (strValue) selectedConfig[key] = JSON.parse(strValue);
    else delete selectedConfig[key];
    (isGlobal ? writeGlobalConfig : writeUserConfig)();
    triggerOnChange(isGlobal, key, selectedConfig[key]);
  };

  config.remove = fullKey => {
    config.set(fullKey);
  };

  config.onChange = (fullKey, callback) => {
    const [isGlobal, selectedConfig, key] = parseKey(fullKey);
    const onChange = isGlobal ? onGlobalChange : onUserChange;
    if (!onChange.has(key)) {
      onChange.set(key, []);
    }
    onChange.get(key).push(callback);
  };

}());
