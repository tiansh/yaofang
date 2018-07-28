; (async function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const priority = util.priority;

  init.onReady(() => {
    const $CONFIG = init.page.$CONFIG;
    util.i18n = $CONFIG.lang;
  });

  init.onReady(async () => {
    const $CONFIG = init.page.$CONFIG;
    await util.config.init($CONFIG.uid);
  }, { priority: priority.FIRST, async: true });

}());
