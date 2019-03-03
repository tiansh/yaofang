; (async function () {

  const yawf = window.yawf = window.yawf || {};

  const storage = yawf.storage;
  const config = yawf.config = yawf.config || {};

  config.init = async function (uid) {
    const userStorage = storage.Storage(`user${uid}Config`);
    const globalStorage = storage.Storage(`globalConfig`);
    const userConfig = storage.Config(userStorage);
    const globalConfig = storage.Config(globalStorage);
    await userConfig.init();
    await globalConfig.init();
    config.user = userConfig;
    config.global = globalConfig;
  };

  config.pool = async function (poolName, { uid = null, isLocal = false }) {
    const prefix = uid ? `user${uid}` : 'global';
    const name = prefix + poolName;
    const storageItem = storage.Storage(name, isLocal);
    const config = storage.Config(storageItem);
    await config.init();
    return config;
  };

}());
