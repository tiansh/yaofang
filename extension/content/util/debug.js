; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const pending = [];

  let debug = (...args) => { pending.push(...args); };

  Promise.resolve(true).then(enabled => {
    if (enabled) {
      pending.forEach(args => { console.log(...args); }); // eslint-disable-line
      debug = (...args) => { console.log(...args); }; // eslint-disable-line
    } else {
      debug = (...args) => { };
    }
  });

  util.debug = (...args) => debug(...args);

  /** @type {Map<Function, number>} */
  const timeUsage = new Map();
  /**
   * @param {Function} func
   */
  util.performance = function (func, ...args) {
    const startTime = performance.now();
    const result = func(...args);
    const endTime = performance.now();
    showPerformance();
    return result;
  };

  let showPerformancePending = null;
  const showPerformance = function () {
    if (showPerformancePending) return;
    showPerformancePending = setTimeout(function () {
      util.debug(timeUsage);
      showPerformancePending = null;
    }, 10e3);
  };


}());
