; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const ruleset = yawf.ruleset;

  const i18n = util.i18n;

  const tabs = yawf.tabs = yawf.tabs || {};

  i18n.aboutTabTitle = {
    cn: '关于',
    hk: '關於',
    tw: '關於',
    en: 'About',
  };

  const about = tabs.about = ruleset.Tab({
    get name() { return i18n.aboutTabTitle; },
  });

}());
