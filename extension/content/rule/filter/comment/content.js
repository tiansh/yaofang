; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const commentParser = yawf.comment;

  const i18n = util.i18n;

  Object.assign(i18n, {
    contentTextCommentGroupTitle: {
      cn: '按内容关键词过滤',
      tw: '按內容關鍵字篩選',
      en: 'Filter by Content Keywords',
    },
    textContentCommentShow: {
      cn: '总是显示包含以下内容的评论||关键词{{items}}',
      tw: '总是显示包含以下內容的評論||關鍵字{{items}}',
      en: 'Always show feeds with these content||Keyword {{items}}',
    },
    textContentCommentHide: {
      cn: '隐藏包含以下内容的评论||关键词{{items}}',
      tw: '隱藏包含以下內容的評論||關鍵字{{items}}',
      en: 'Hide feeds with these content||Keyword {{items}}',
    },
  });

  class TextCommentRule extends rule.class.Rule {
    get v7Support() { return true; }
    constructor(item) {
      super(item);
    }
  }

  rule.groups({
    baseClass: TextCommentRule,
    tab: 'comment',
    key: 'text',
    version: 1,
    type: 'strings',
    title: () => i18n.contentTextCommentGroupTitle,
    details: {
      hide: {
        title: () => i18n.textContentCommentHide,
      },
      show: {
        title: () => i18n.textContentCommentShow,
      },
    },
    fast: {
      types: [['comment'], ['text']],
      radioGroup: 'comment',
      render: commentParser.fast.render.text,
    },
  });

  Object.assign(i18n, {
    contentRegexCommentGroupTitle: {
      cn: '按内容正则式过滤',
      hk: '按內容正則式篩選',
      tw: '按內容正規式篩選',
      en: 'Filter by Content Regex',
    },
    regexContentCommentShow: {
      cn: '总是显示匹配以下正则表达式的评论||关键词{{items}}',
      hk: '总是显示匹配以下正則表達式的評論||關鍵字{{items}}',
      tw: '总是显示匹配以下正規表示式的評論||關鍵字{{items}}',
      en: 'Always show feeds match these regexen||Regexen {{items}}',
    },
    regexContentCommentHide: {
      cn: '隐藏匹配以下正则表达式的评论||关键词{{items}}',
      hk: '隱藏匹配以下正則表達式的評論||關鍵字{{items}}',
      tw: '隱藏匹配以下正規表示式的評論||關鍵字{{items}}',
      en: 'Hide feeds match these regexen||Regexen {{items}}',
    },
  });

  class RegexCommentRule extends rule.class.Rule {
    get v7Support() { return true; }
    constructor(item) {
      super(item);
    }
  }

  rule.groups({
    baseClass: RegexCommentRule,
    tab: 'comment',
    key: 'regex',
    version: 110,
    type: 'regexen',
    title: () => i18n.contentRegexCommentGroupTitle,
    details: {
      hide: {
        title: () => i18n.regexContentCommentHide,
      },
      show: {
        title: () => i18n.regexContentCommentShow,
      },
    },
    fast: {
      types: [['multitextcomment'], ['text', 'multitext', 'comment']],
      radioGroup: 'comment',
      render: commentParser.fast.render.regex,
    },
  });

}());
