; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.moreTabTitle = {
    cn: '更多',
    tw: '其他',
    en: 'More',
  };

  const more = yawf.rules.more = {};
  more.more = rule.Tab({
    template: () => i18n.moreTabTitle,
  });

}());
