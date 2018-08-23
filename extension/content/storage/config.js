; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

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

}());
