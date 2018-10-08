; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const network = yawf.network = {};

  network.getUniqueKey = (function () {
    let last = 0;
    return function () {
      return '' + (last = Math.max(last + 1, Date.now()));
    };
  }());

  network.fakeCallback = function () {
    return 'STK_' + network.getUniqueKey();
  };

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
