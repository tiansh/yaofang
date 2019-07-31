; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.debugGroupTitle = {
    cn: '调试',
    tw: '偵錯',
    en: 'Debug',
  };

  const debug = about.debug = {};
  debug.debug = rule.Group({
    parent: about.about,
    template: () => i18n.debugGroupTitle,
  });

  i18n.debugText = {
    cn: '在控制台打印调试信息',
    tw: '在控制台列印偵錯訊息',
    en: 'Log debug info to console',
  };

  debug.enable = rule.Rule({
    id: 'script_enable_debug',
    version: 1,
    parent: debug.debug,
    template: () => i18n.debugText,
    ainit: function () {
      util.debug.setEnabled(this.isEnabled());
    },
  });

}());
