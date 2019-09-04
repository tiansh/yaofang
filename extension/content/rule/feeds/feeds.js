; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.feedsTabTitle = {
    cn: '微博展示',
    en: 'Feeds',
  };

  const feeds = yawf.rules.feeds = {};
  feeds.feeds = rule.Tab({
    template: () => i18n.feedsTabTitle,
    pagemenu: true,
  });

}());
