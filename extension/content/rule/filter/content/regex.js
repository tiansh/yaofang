; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const i18n = util.i18n;
  i18n.contentRegexGroupTitle = {
    cn: '按内容正则式过滤',
    hk: '按內容正則式篩選',
    tw: '按內容正規式篩選',
    en: 'Filter by Content Regex',
  };

  Object.assign(i18n, {
    regexContentShow: {
      cn: '总是显示匹配以下正则表达式的微博||正则式{{items}}',
      hk: '总是显示匹配以下正則表達式的微博||正則式{{items}}',
      tw: '总是显示匹配以下正規表示式的微博||正規式{{items}}',
      en: 'Always show feeds match these regexen||Regexen {{items}}',
    },
    regexContentHide: {
      cn: '隐藏匹配以下正则表达式的微博||正则式{{items}}',
      hk: '隱藏匹配以下正則表達式的微博||正則式{{items}}',
      tw: '隱藏匹配以下正規表示式的微博||正規式{{items}}',
      en: 'Hide feeds match these regexen||Regexen {{items}}',
    },
    regexContentFold: {
      cn: '折叠匹配以下正则表达式的微博||正则式{{items}}',
      hk: '折叠匹配以下正則表達式的微博||正則式{{items}}',
      tw: '折叠匹配以下正規表示式的微博||正規式{{items}}',
      en: 'Fold feeds match these regexen||Regexen {{items}}',
    },
    regexContextReason: {
      cn: '正则匹配',
      hk: '正則符合',
      tw: '正規符合',
      en: 'regexp matched',
    },
  });

  class RegexFeedRule extends rule.class.Rule {
    get weiboVersion() { return this.feedAction === 'fold' ? [6] : [6, 7]; }
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function regexFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.text.detail(feed);
        const regexen = rule.ref.items.getConfigCompiled();
        const matchReg = regexen.find(regex => regex.test(text));
        if (!matchReg) return null;
        const reason = (matchReg + '').match(/\(\?=\|(([^)]|\\\))*)\)/)?.[1] ?? i18n.regexContextReason;
        return { result: rule.feedAction, reason };
      }, { priority: this.priority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: RegexFeedRule,
    tab: 'content',
    key: 'regex',
    version: 1,
    type: 'regexen',
    title: () => i18n.contentRegexGroupTitle,
    details: {
      hide: {
        title: () => i18n.regexContentHide,
      },
      show: {
        title: () => i18n.regexContentShow,
      },
      fold: {
        title: () => i18n.regexContentFold,
      },
    },
    fast: {
      types: [['multitext'], ['text', 'comment', 'multitextcomment']],
      radioGroup: 'text',
      render: feedParser.fast.render.regex,
    },
  });

}());
