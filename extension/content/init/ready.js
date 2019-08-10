; (function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const priority = util.priority;
  const css = util.css;

  const config = yawf.config;

  init.onReady(async () => {
    const $CONFIG = init.page.$CONFIG;
    await config.init($CONFIG.uid);
    util.i18n = $CONFIG.lang;
  }, { priority: priority.FIRST });

  util.debug('yawf loading, hide all');
  const hideAll = css.add('.WB_miniblog { visibility: hidden; opacity: 0; }');
  init.onReady(() => {
    hideAll.remove();
    util.debug('yawf loaded, disable hide all');
  }, { priority: priority.LAST });
  init.onDeinit(() => {
    hideAll.remove();
    util.debug('yawf unloaded, disable hide all');
  });

}());
