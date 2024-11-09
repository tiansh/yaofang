; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const commentParser = yawf.comment;

  const i18n = util.i18n;

  Object.assign(i18n, {
    accountCommentGroupTitle: {
      cn: '按用户过滤',
      tw: '按用戶篩選',
      en: 'Filter by Users',
    },
    accountCommentShow: {
      cn: '总是显示包含以下用户的评论||用户{{items}}',
      tw: '总是显示包含以下用戶的評論||用戶{{items}}',
      en: 'Always show feeds with these users||User {{items}}',
    },
    accountCommentHide: {
      cn: '隐藏包含以下用户的评论||用户{{items}}',
      tw: '隱藏包含以下用戶的評論||用戶{{items}}',
      en: 'Hide feeds with these users||User {{items}}',
    },
  });


  class CommentUserFeedRule extends rule.class.Rule {
    get v7Support() { return true; }
    constructor(item) {
      super(item);
    }
  }

  rule.groups({
    baseClass: CommentUserFeedRule,
    tab: 'comment',
    key: 'name',
    type: 'usernames',
    version: 110,
    title: () => i18n.accountCommentGroupTitle,
    details: {
      hide: {
        title: () => i18n.accountCommentHide,
      },
      show: {
        title: () => i18n.accountCommentShow,
      },
    },
    fast: {
      types: [['commentuser', 'account'], ['original', 'author', 'mention']],
      radioGroup: 'commentuser',
      render: commentParser.fast.render.user,
    },
  });

}());
