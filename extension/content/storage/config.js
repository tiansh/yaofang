; (function () {

  const yawf = window.yawf = window.yawf || {};

  const storage = yawf.storage;
  const config = yawf.config = yawf.config || {};
  const pools = config.pools = [];

  config.init = async function (uid) {
    const userPromise = uid != null ? config.pool('Config', { uid, isLocal: true }) : Promise.resolve(null);
    const globalPromise = config.pool('Config', { isLocal: true });
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
