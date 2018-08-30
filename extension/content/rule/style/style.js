; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.styleTabTitle = {
    cn: '外观样式',
    tw: '外觀樣式',
    en: 'Appearance',
  };

  const style = yawf.rules.style = {};
  style.style = rule.Tab({
    id: 'style',
    template: () => i18n.styleTabTitle,
  });

}());
