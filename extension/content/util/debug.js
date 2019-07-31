; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const pending = [];
  const pendingOutput = (...args) => { pending.push(args); };
  const output = (message, ...args) => {
    if (typeof message === 'string') {
      console.log(`Yaofang | ${message}`, ...args);
    } else if (message !== void 0) {
      console.log(`Yaofang |`, message, ...args);
    }
  };
  const noop = () => { };

  let debug = pendingOutput;
  let debugEnabled = null;


  /** @type {Map<Function, number>} */
  const timeUsage = new Map();
  /**
   * @param {Function} func
   */
  util.performance = function (func, ...args) {
    const startTime = performance.now();
    const result = func(...args);
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (debugEnabled !== false) {
      if (!timeUsage.has(func)) timeUsage.set(func, duration);
      else timeUsage.set(func, timeUsage.get(func) + duration);
      showPerformance();
    }
    return result;
  };

  let showPerformancePending = null;
  const showPerformance = function showPerformance() {
    if (showPerformancePending === false) {
      showPerformancePending = true;
    }
    if (showPerformancePending) return;
    showPerformancePending = false;
    util.debug('Performance meansure: ', timeUsage);
    setTimeout(function () {
      const showNext = showPerformancePending === true;
      showPerformancePending = null;
      if (showNext) showPerformance();
    }, 10e3);
  };

  const setEnabled = function (enabled) {
    const messages = pending.splice(0);
    debugEnabled = enabled;
    if (enabled) {
      messages.forEach(args => { output(...args); }); // eslint-disable-line
      debug = output; // eslint-disable-line
    } else {
      timeUsage.clear();
      debug = noop;
    }
  };

  util.debug = (...args) => debug(...args);
  util.debug.setEnabled = setEnabled;

}());
