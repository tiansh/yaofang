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
 */

; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init = yawf.init || {};

  const page = init.page = init.page || {};

  const validPageReady = $CONFIG => {
    // 必须的参数
    if (!$CONFIG) return false;
    if (!$CONFIG.uid) return false;
    if (!$CONFIG.nick) return false;
    if (!Number($CONFIG.islogin)) return false;
    return true;
  };

  const validPageDom = () => {
    // 如果有登录按钮，则说明没有登录，此时不工作
    if (document.querySelector('.gn_login')) return false;
    return true;
  };

  /** @type {boolean?} */
  let status = null;
  /** @type {Set<{ callback: Function, priority: number, async: boolean? }>} */
  const onReadyCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number, async: boolean? }>} */
  const onLoadCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number, async: boolean? }>} */
  const onConfigChangeCallback = new Set();
  /** @type {Set<{ callback: Function, priority: number, async: boolean? }>} */
  const onDeinitCallback = new Set();

  const noop = () => { };

  /**
   * @param {Set<{ callback: Function, priority: number, async: boolean? }>} set
   */
  const runSet = async set => {
    const list = [...set.values()].sort((p, q) => q.priority - p.priority);
    for (const { callback, async } of list) {
      try {
        const result = callback();
        if (async) await result;
      } catch (e) {
        util.debug('Error while initializing:\n%o', e);
      }
    }
    set.clear();
  };

  init.status = () => status;
  // 触发 Ready
  init.ready = async $CONFIG => {
    page.$CONFIG = $CONFIG;
    status = true;
    init.ready = noop;
    util.debug('yawf onready');
    await runSet(onReadyCallback);
    if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
      setTimeout(init.dcl, 0);
    } else {
      document.addEventListener('DOMContentLoaded', init.dcl);
    }
  };
  // 触发 ConfigChange
  init.configChange = async $CONFIG => {
    util.debug('yawf onconfigchange: %o', $CONFIG);
    await runSet(onConfigChangeCallback);
    if (validPageReady($CONFIG)) {
      await init.ready($CONFIG);
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
    (callback, { priority = util.priority.DEFAULT, async = false } = {}) => {
      if (status === null) {
        callbackCollection.add({ callback, priority, async });
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
