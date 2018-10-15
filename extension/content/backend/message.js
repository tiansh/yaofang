; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const message = yawf.message = {};

  message.export = (function () {
    /** @type {Map<string, Function>} */
    const exported = new Map();

    browser.runtime.onMessage.addListener(async (message, sender) => {
      const { method, params = [] } = message;
      const handler = exported.get(method);
      return new Promise(async (resolve, reject) => {
        try {
          resolve(handler.apply(sender, params));
        } catch (ex) { reject(ex); }
      });
    });

    return function (f) {
      exported.set(f.name, f);
      return f;
    };
  }());

  message.invoke = new Proxy({}, {
    get: (empty, method) => (...params) => (
      browser.runtime.sendMessage({ method, params })
    ),
  });

}());

