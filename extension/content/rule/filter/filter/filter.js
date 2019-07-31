
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.filterTabTitle = {
    cn: '微博过滤',
    tw: '微博篩選',
    en: 'Filter',
  };

  const filter = yawf.rules.filter = {};
  filter.filter = rule.Tab({
    template: () => i18n.filterTabTitle,
  });

}());
