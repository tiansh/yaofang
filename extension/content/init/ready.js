; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  init.onReady(() => {
    const $CONFIG = init.page.$CONFIG;
    util.i18n = $CONFIG.lang;
  });

}());
