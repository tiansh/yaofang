/*
 * 初始化相关流程
 *
 * 初始化流程
 * Ready:
 *   当获取到 $CONFIG 参数时尽快调用
 * Load:
 *   当 DOMContentLoaded 时调用，此时 DOM 树可用
 *   Load 总是在 Ready 之后
 * Deinit:
 *   当出错时调用，此时应当消除之前行为的各种副作用
 *   Deinit 可能不触发 Ready，也可能在 Ready 之后
 *   Deinit 与 Load 互斥
 *
 * 如果注册的回调返回一个 thenable 对象，那么会等它解决再继续后续的回调
 * 如果不希望让后面的逻辑异步进行，请不要直接用 async 函数，而是在普通函数里再写一个 async
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init = yawf.init ?? {};
  yawf.WEIBO_VERSION = 0;

  const page = init.page = init.page ?? {};

  const validPageReadyV6 = $CONFIG => {
    // 必须的参数
    if (!$CONFIG) return false;
    if (!$CONFIG.uid) return false;
    if (!$CONFIG.nick) return false;
    if ($CONFIG.islogin === '0') return false;
    return true;
  };

  const validPageReadyV7 = config => {
    // 必须的参数
    if (!config) return false;
    if (!config.user) return false;
    if (!config.user.idstr) return false;
    if (!config.user.screen_name) return false;
    return true;
  };

  const validPageDom = () => {
    // 如果有登录按钮，则说明没有登录，此时不工作
    if (document.querySelector('.gn_login')) return false;
    return true;
  };

  /** @type {boolean?} */
  let status = null;
  /** @type {Set<{ callback: Function, priority: number }>} */
  const onReadyCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number }>} */
  const onLoadCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number }>} */
  const onConfigChangeCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number }>} */
  const onDeinitCallback = new Set();

  const noop = () => { };

  /**
   * @param {Set<{ callback: Function, priority: number }>} set
   */
  const runSet = async set => {
    const list = [...set.values()].sort((p, q) => q.priority - p.priority);
    for (const { callback } of list) {
      try {
        const result = callback();
        if (typeof result?.then === 'function') {
          await Promise.resolve(result);
        }
      } catch (e) {
        util.debug('Error while initializing:\n%o', e);
      }
    }
    set.clear();
  };

  const genV6LikeConfigByV7Config = config => ({
    uid: config.user.idstr,
    name: config.user.screen_name,
    oid: null, // 无数据
    domain: '', // 无数据
    bpType: '', // 无数据
    location: '', // 无数据
    lang: 'zh-CN',
    skin: null, // 无数据
  });

  init.status = () => status;
  // 触发 Ready
  init.ready = async $CONFIG => {
    status = true;
    init.ready = init.deinit = noop;
    util.debug('yawf onready');
    await runSet(onReadyCallback);
    if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
      setTimeout(init.dcl, 0);
    } else {
      document.addEventListener('DOMContentLoaded', init.dcl);
    }
  };
  // 触发 ConfigChange
  init.configChange = async config => {
    util.debug('yawf onconfigchange: %o', config);
    if (validPageReadyV6(config)) {
      if (!yawf.WEIBO_VERSION) {
        yawf.WEIBO_VERSION = 6;
        document.documentElement.classList.add('yawf-WBV6');
      }
      if (yawf.WEIBO_VERSION !== 6) return;
      page.$CONFIG = config;
      await runSet(onConfigChangeCallback);
      await init.ready(config);
    } else if (validPageReadyV7(config)) {
      if (!yawf.WEIBO_VERSION) {
        yawf.WEIBO_VERSION = 7;
        document.documentElement.classList.add('yawf-WBV7');
      }
      if (yawf.WEIBO_VERSION !== 7) return;
      if (!page.route) return;
      page.config = config;
      page.$CONFIG = genV6LikeConfigByV7Config(config);
      await runSet(onConfigChangeCallback);
      await init.ready(config);
    } else {
      await init.deinit();
      return;
    }
  };
  // 触发 Deinit
  init.deinit = async () => {
    status = false;
    init.deinit = init.ready = init.dcl = noop;
    util.debug('yawf deinit');
    await runSet(onDeinitCallback);
  };
  // 触发 Load
  init.dcl = async () => {
    if (!validPageDom()) {
      await init.deinit();
      return;
    }
    status = {};
    init.dcl = noop;
    util.debug('yawf onload');
    await runSet(onLoadCallback);
  };

  const register = callbackCollection => (
    (callback, { priority = util.priority.DEFAULT } = {}) => {
      if (status === null) {
        callbackCollection.add({ callback, priority });
      } else if (status) {
        Promise.resolve().then(callback);
      }
    }
  );

  init.onReady = register(onReadyCallback);
  init.onLoad = register(onLoadCallback);
  init.onConfigChange = register(onConfigChangeCallback);
  init.onDeinit = register(onDeinitCallback);

}());
