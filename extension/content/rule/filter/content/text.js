; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const i18n = util.i18n;

  Object.assign(i18n, {
    contentTextGroupTitle: {
      cn: '按内容关键词过滤',
      tw: '按內容關鍵字篩選',
      en: 'Filter by Content Keywords',
    },
    textContentShow: {
      cn: '总是显示包含以下内容的微博||关键词{{items}}',
      tw: '总是显示包含以下內容的微博||關鍵字{{items}}',
      en: 'Always show feeds with these content||keyword {{items}}',
    },
    textContentHide: {
      cn: '隐藏包含以下内容的微博||关键词{{items}}',
      tw: '隱藏包含以下內容的微博||關鍵字{{items}}',
      en: 'Hide feeds with these content||keyword {{items}}',
    },
    textContentFold: {
      cn: '折叠包含以下内容的微博||关键词{{items}}',
      tw: '折疊包含以下內容的微博||關鍵字{{items}}',
      en: 'Fold feeds with these content||keyword {{items}}',
    },
    textContentReason: {
      cn: '关键词“{1}”',
      tw: '关键字「{1}」',
      en: 'content "{1}"',
    },
  });

  class TextFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function textFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.text.simple(feed).toLowerCase();
        const keywords = rule.ref.items.getConfig();
        const contain = keywords.find(keyword => text.includes(keyword.toLowerCase()));
        if (!contain) return null;
        const reasonText = contain.length > 8 ? contain.slice(0, 6) + '…' : contain;
        const reason = i18n.textContentReason.replace('{1}', () => reasonText);
        return { result: rule.feedAction, reason };
      }, { priority: this.priority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: TextFeedRule,
    tab: 'content',
    key: 'text',
    version: 1,
    type: 'strings',
    title: () => i18n.contentTextGroupTitle,
    details: {
      hide: {
        title: () => i18n.textContentHide,
      },
      show: {
        title: () => i18n.textContentShow,
      },
      fold: {
        title: () => i18n.textContentFold,
      },
    },
    fast: {
      types: [['text'], ['comment']],
      radioGroup: 'text',
      render: feedParser.fast.render.text,
    },
  });

}());
