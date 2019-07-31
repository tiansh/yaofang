; (function () {

  const yawf = window.yawf = window.yawf || {};

  const util = yawf.util;
  const storage = yawf.storage;
  const config = yawf.config = yawf.config || {};
  const pools = config.pools = [];

  const i18n = util.i18n;

  config.init = async function (uid) {
    const userPromise = config.pool('Config', { uid });
    const globalPromise = config.pool('Config');
    const [user, global] = await Promise.all([userPromise, globalPromise]);
    Object.assign(config, { user, global });
  };

  config.pool = async function (poolName, config = {}) {
    const { uid = null, isLocal = false } = config;
    const prefix = uid ? `user${uid}` : 'global';
    const name = prefix + poolName;
    const storageItem = storage.Storage(name, isLocal);
    const pool = storage.Config(storageItem);
    Object.assign(pool, config);
    await pool.init();
    pools.push(pool);
    return pool;
  };

}());
