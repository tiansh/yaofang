; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.styleTabTitle = {
    cn: '微博展示',
    en: 'Feeds',
  };

  const style = yawf.rules.style = {};
  style.style = rule.Tab({
    template: () => i18n.styleTabTitle,
  });

}());
