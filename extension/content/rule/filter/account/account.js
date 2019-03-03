; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.authorTabTitle = { cn: '作者', tw: '作者', en: 'Author' };
  const author = yawf.rules.author = {};
  author.author = rule.Tab({
    template: () => i18n.authorTabTitle,
  });

  i18n.originalTabTitle = { cn: '原作', tw: '原作', en: 'Original' };
  const original = yawf.rules.original = {};
  original.original = rule.Tab({
    template: () => i18n.originalTabTitle,
  });

  i18n.mentionTabTitle = { cn: '提到', tw: '提到', en: 'Mention' };
  const mention = yawf.rules.mention = {};
  mention.mention = rule.Tab({
    template: () => i18n.mentionTabTitle,
  });

}());
