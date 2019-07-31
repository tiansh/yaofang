; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.sourceTabTitle = {
    cn: '来源',
    tw: '來源',
    en: 'Source',
  };

  const source = yawf.rules.source = {};
  source.source = rule.Tab({
    template: () => i18n.sourceTabTitle,
  });

}());
