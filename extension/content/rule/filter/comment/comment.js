; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.commentTabTitle = {
    cn: '评论过滤',
    tw: '評論篩選',
    en: 'Comment',
  };

  const comment = yawf.rules.comment = {};
  comment.comment = rule.Tab({
    template: () => i18n.commentTabTitle,
  });

}());
