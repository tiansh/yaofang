; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};
  const functools = util.functools = util.functools || {};

  /**
   * @template T
   * @param {T & Function} f
   * @returns {T}
   */
  functools.once = function (f) {
    let executed = false, value = null;
    const name = f.name, length = f.length;
    const wrap = function (...args) {
      if (executed) return value;
      value = f(...args);
      f = null;
      executed = true;
      return value;
    };
    Object.defineProperty(wrap, 'name', { get: () => name });
    Object.defineProperty(wrap, 'length', { get: () => length });
    return wrap;
  };

}());
