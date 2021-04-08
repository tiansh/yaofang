/**
 * 这个文件用于检查页面中是否有新元素添加或元素变化，并自动触发各类回调
 * 由于微博会频繁更新界面上显示的日期（××分钟前）文本，
 *   这里特别过滤掉了日期显示的相关变化，如果仅包括此类变化则不触发回调
 * yawf.observer.dom.add(callback: Function) 添加一个回调
 * yawf.observer.dom.remove(callback: Function) 取消一个回调
 */
; (function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const observer = yawf.observer = yawf.observer ?? {};
  observer.dom = {};

  const priority = util.priority;
  const performance = util.performance;

  /** @type {Array<Function>} */
  const callbacks = [];

  /**
   * 当页面有任何变化时回调
   * @param {Function} callback
   */
  observer.dom.add = function (callback) {
    callbacks.push(callback);
    return callback;
  };

  /**
   * 移除之前添加的回调
   * @param {Function} callback
   */
  observer.dom.remove = function (callback) {
    let found = false;
    while (true) {
      const index = callbacks.findIndex(item => item === callback);
      if (index === -1) return found;
      callbacks.splice(index, 1);
      found = true;
    }
  };

  const act = function () {
    callbacks.forEach(callback => {
      try {
        performance(callback);
      } catch (e) {
        util.debug('Error while handling mutation callback: %o %o', callback, e);
      }
    });
  };

  /** @type {boolean?} */
  let status = null;
  /** @type {MutationCallback} */
  const onMutation = function (mutation) {
    if (mutation && mutation.every(function isDate(x) {
      let target = x.target;
      return target.hasAttribute('date') || target.hasAttribute('yawf-date');
    })) return;
    if (status === false) status = true;
    if (status !== null) return;
    act(); status = false;
    setTimeout(function () {
      if (status === true) act();
      status = null;
    }, 100);
  };

  const observe = function () {
    onMutation();
    (new MutationObserver(onMutation))
      .observe(document.body, { childList: true, subtree: true });
  };

  init.onLoad(function () {
    observe();
  }, { priority: priority.LAST + priority.AFTER * 2 });

}());
