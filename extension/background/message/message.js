; (function () {

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

  message.invoke = function (tabId) {
    const tab = tabId ? null : browser.tabs.query({ currentWindow: true, active: true });
    return new Proxy({}, {
      get: (empty, method) => (...params) => tabId ? (
        browser.tabs.sendMessage(tabId, { method, params })
      ) : tab.then(([{ id: tabId }]) => (
        browser.tabs.sendMessage(tabId, { method, params })
      )),
    });
  };

}());

