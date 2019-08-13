; (function () {

  const yawf = window.yawf = window.yawf || {};

  const message = yawf.message;

  const externalMenu = yawf.externalMenu = {};

  let index = 0;
  const callbackCollection = new Map();

  externalMenu.add = function ({ title, callback }) {
    const id = ++index;
    callbackCollection.set(id, { title, callback });
  };

  message.export(async function listExternalMenu() {
    return [...callbackCollection.entries()].map(([id, { title }]) => ({ id, title }));
  });

  message.export(async function externalMenuClicked(id) {
    callbackCollection.get(id).callback();
  });

}());

