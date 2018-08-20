; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.aboutTabTitle = {
    cn: '关于',
    hk: '關於',
    tw: '關於',
    en: 'About',
  };

  const about = yawf.rules.about = {};
  about.about = rule.Tab({
    id: 'about',
    template: () => i18n.aboutTabTitle,
  });

}());
