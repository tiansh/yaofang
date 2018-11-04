; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.contentTabTitle = {
    cn: '内容',
    tw: '內容',
    en: 'Content',
  };

  const content = yawf.rules.content = {};
  content.content = rule.Tab({
    template: () => i18n.contentTabTitle,
  });

}());
