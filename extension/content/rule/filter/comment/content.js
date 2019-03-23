; (async function () {

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
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.comment.filter(function textCommentFilter(/** @type {Element} */comment) {
        const text = commentParser.text(comment);
        const keywords = rule.ref.items.getConfig();
        const contain = keywords.find(keyword => text.includes(keyword));
        if (!contain) return null;
        const reasonText = contain.length > 8 ? contain.slice(0, 6) + '…' : contain;
        const reason = i18n.textContentReason.replace('{1}', () => reasonText);
        return { result: rule.feedAction, reason };
      }, { priority: this.filterPriority });
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
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.comment.filter(function regexCommentFilter(/** @type {Element} */comment) {
        const text = commentParser.text(comment);
        const regexen = rule.ref.items.getConfigCompiled();
        const matchReg = regexen.find(regex => regex.test(text));
        if (!matchReg) return null;
        return { result: rule.feedAction };
      }, { priority: this.filterPriority });
    }
  }

  rule.groups({
    baseClass: RegexCommentRule,
    tab: 'comment',
    key: 'regex',
    version: 1,
    type: 'strings',
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
