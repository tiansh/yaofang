; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const network = yawf.network = {};

  network.fakeCallback = (function () {
    let last = 0;
    return function () {
      return 'STK_' + (last = Math.max(last + 1, Date.now()));
    };
  }());

  /**
   * @param {string} resp
   */
  network.parseJson = function (resp) {
    return JSON.parse(resp
      .replace(/^(?:try\{[^{]*\()?\{/, '{')
      .replace(/}(?:\)\s*;?\s*}catch\(e\)\{\};?)?$/, '}')
    );
  };


}());
