; (function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;

  const priority = util.priority;

  const config = yawf.config;

  init.onReady(async () => {
    await config.init(init.page.config.user.idstr);
    util.i18n = 'zh-CN';
    util.time.setDiff(0);
  }, { priority: priority.FIRST });

}());
