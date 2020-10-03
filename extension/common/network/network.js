; (function () {

  const yawf = window.yawf = window.yawf || {};
  const network = yawf.network = {};
  const util = yawf.util;

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

  network.jsonp = function (url, callback) {
    return new Promise((resolve, reject) => {
      const key = 'yawf_jsonp_' + callback;
      window.addEventListener(key, function (event) {
        if (event.detail.data) {
          const data = JSON.parse(event.detail.data);
          resolve(data);
        } else {
          reject();
        }
      });
      util.inject(function (url, callback, key) {
        Object.defineProperty(window, callback, {
          configurable: true,
          enumerable: false,
          writable: true,
          value: function (data) {
            const event = new CustomEvent(key, {
              detail: { data: JSON.stringify(data) },
            });
            window.dispatchEvent(event);
            delete window[callback];
          },
        });
        const reject = function () {
          const event = new CustomEvent(key, { detail: { } });
          window.dispatchEvent(event);
        };
        const script = document.createElement('script');
        script.src = url;
        script.addEventListener('load', function () {
          script.remove();
          setTimeout(reject, 3000);
        });
        script.addEventListener('error', reject);
        document.body.appendChild(script);
      }, url, callback, key);
    });
  };


}());
