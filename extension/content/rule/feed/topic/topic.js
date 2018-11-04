; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.topicTabTitle = {
    cn: '话题',
    tw: '話題',
    en: 'Topic',
  };

  const topic = yawf.rules.topic = {};
  topic.topic = rule.Tab({
    template: () => i18n.topicTabTitle,
  });

}());
