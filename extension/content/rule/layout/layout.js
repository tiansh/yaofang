; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.layoutTabTitle = {
    cn: '版面展示',
    en: 'Layout',
  };

  const layout = yawf.rules.layout = {};
  layout.layout = rule.Tab({
    template: () => i18n.layoutTabTitle,
    pagemenu: true,
  });

}());
