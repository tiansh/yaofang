; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const content = yawf.rules.content;

  const i18n = util.i18n;
  i18n.contentRegexGroupTitle = {
    cn: '按内容正则式过滤',
    hk: '按內容正則式篩選',
    tw: '按內容正規式篩選',
    en: 'Filter by Content Regex',
  };

  const regex = content.regex = {};
  regex.regex = rule.Group({
    parent: content.content,
    template: () => i18n.contentRegexGroupTitle,
  });

  Object.assign(i18n, {
    regexContentShow: {
      cn: '总是显示匹配以下正则表达式的微博||正则式{{regex}}',
      hk: '总是显示匹配以下正則表達式的微博||正則式{{regex}}',
      tw: '总是显示匹配以下正規表示式的微博||正規式{{regex}}',
      en: 'Always show feeds match these regexen||Regexen {{regex}}',
    },
    regexContentHide: {
      cn: '隐藏匹配以下正则表达式的微博||正则式{{regex}}',
      hk: '隱藏匹配以下正則表達式的微博||正則式{{regex}}',
      tw: '隱藏匹配以下正規表示式的微博||正規式{{regex}}',
      en: 'Hide feeds match these regexen||Regexen {{regex}}',
    },
    regexContentFold: {
      cn: '折叠匹配以下正则表达式的微博||正则式{{regex}}',
      hk: '折叠匹配以下正則表達式的微博||正則式{{regex}}',
      tw: '折叠匹配以下正規表示式的微博||正規式{{regex}}',
      en: 'Fold feeds match these regexen||Regexen {{regex}}',
    },
  });

  class RegexFeedRule extends rule.class.Rule {
    constructor(item) {
      item.always = true;
      item.ref = item.ref || {};
      item.ref.regex = { type: 'regexen' };
      item.feedAction = item.id;
      item.parent = regex.regex;
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function regexFeedFilter(/** @type {Element} */feed) {
        // FIXME 这段临时的，之后再提出去详细写
        const contentItems = feed.querySelectorAll([
          '[node-type="feed_list_content"]',
          '[node-type="feed_list_reason"]',
        ].join(','));
        const text = [...contentItems].map(item => item.textContent).join('\n');
        const regexen = rule.ref.regex.getConfigCompiled();
        const matches = regexen.some(regex => regex.test(text));
        if (matches) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  regex.show = new RegexFeedRule({
    id: 'show',
    priority: 1e5,
    template: () => i18n.regexContentShow,
  });

  regex.hide = new RegexFeedRule({
    id: 'hide',
    priority: 0,
    template: () => i18n.regexContentHide,
  });

  regex.fold = new RegexFeedRule({
    id: 'fold',
    priority: -1e5,
    template: () => i18n.regexContentFold,
  });

}());
