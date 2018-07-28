// 初始化相关流程

// 初始化流程
// Ready:
//   当获取到 $CONFIG 参数时尽快调用
// Load:
//   当 DOMContentLoaded 时调用，此时 DOM 树可用
//   Load 总是在 Ready 之后
// Deinit:
//   当出错时调用，此时应当消除之前行为的各种副作用
//   Deinit 可能不触发 Ready，也可能在 Ready 之后
//   Deinit 与 Load 互斥

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init = yawf.init || {};

  const page = init.page = init.page || {};

  const validPageReady = $CONFIG => {
    // 必须的参数
    if (!$CONFIG) return false;
    if (!$CONFIG.uid) return false;
    if (!$CONFIG.nick) return false;
    return true;
  };

  const validPageDom = $CONFIG => {
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
  const onDeinitCallback = new Set();

  const noop = () => { };

  /**
   * @param {Set<{ callback: Function, priority: number }>} set
   */
  const runSet = set => {
    const list = [...set.values()].sort((p, q) => q.priority - p.priority);
    list.forEach(({ callback }) => {
      try { callback(); }
      catch (e) {
        util.debug('Error while initializing:\n%o', e);
      }
    });
    set.clear();
  };

  init.status = () => status;
  // 触发 Ready
  init.ready = $CONFIG => {
    if (!validPageReady($CONFIG)) {
      return init.deinit();
    }
    page.$CONFIG = $CONFIG;
    runSet(onReadyCallback);
    status = true;
    init.ready = noop;
    if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
      setTimeout(init.dcl, 0);
    } else {
      document.addEventListener('DOMContentLoaded', init.dcl);
    }
  };
  // 触发 Deinit
  init.deinit = () => {
    runSet(onDeinitCallback);
    status = false;
    init.ready = init.dcl = noop;
  };
  // 触发 Load
  init.dcl = () => {
    if (!validPageDom()) {
      return init.deinit();
    }
    runSet(onLoadCallback);
    status = {};
    init.dcl = noop;
  };

  /**
   * @param {Function} callback
   * @param {number} priority
   */
  init.onReady = (callback, priority) => {
    if (status === null) {
      onReadyCallback.add({ callback, priority });
    } else if (status) {
      Promise.resolve().then(callback);
    }
  };

  /**
   * @param {Function} callback
   * @param {number} priority
   */
  init.onLoad = (callback, priority) => {
    if (status === null || status === true) {
      onLoadCallback.add({ callback, priority });
    } else if (status) {
      Promise.resolve().then(callback);
    }
  };

  /**
   * @param {Function} callback
   * @param {number} priority
   */
  init.onDeinit = (callback, priority) => {
    if (status === null) {
      onDeinitCallback.add({ callback, priority });
    } else if (status === false) {
      Promise.resolve().then(callback);
    }
  };

}());
