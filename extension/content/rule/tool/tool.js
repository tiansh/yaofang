; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.toolTabTitle = {
    cn: '功能改造',
    en: 'Functional',
  };

  const tool = yawf.rules.tool = {};
  tool.tool = rule.Tab({
    id: 'tool',
    template: () => i18n.toolTabTitle,
  });

}());
