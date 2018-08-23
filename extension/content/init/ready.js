; (async function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const priority = util.priority;

  const config = yawf.config;

  init.onReady(async () => {
    const $CONFIG = init.page.$CONFIG;
    await config.init($CONFIG.uid);
    util.i18n = $CONFIG.lang;
  }, { priority: priority.FIRST, async: true });

  const hideAll = util.css.add('.WB_miniblog { visibility: hidden; opacity: 0; }');
  init.onReady(() => { hideAll.remove(); }, { priority: priority.LAST });
  init.onDeinit(() => { hideAll.remove(); });

}());
