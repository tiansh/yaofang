; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const pending = [];
  const log = (...args) => console.log(...args); // eslint-disable-line

  util.debug = (...args) => { pending.push(...args); };

  const enabled = await browser.storage.sync.get('debug').debug || true;
  if (enabled) {
    pending.forEach(args => log(...args));
    util.debug = (...args) => { log(...args); };
  } else {
    util.debug = (...args) => { };
  }

}());
