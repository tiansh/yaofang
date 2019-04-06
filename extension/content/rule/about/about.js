; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.aboutTabTitle = {
    cn: '关于药方',
    tw: '關於藥方',
    en: 'About',
  };

  const about = yawf.rules.about = {};
  about.about = rule.Tab({
    template: () => i18n.aboutTabTitle,
  });

}());
