; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;

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
    regexFastDescription: {
      cn: '匹配{1}的微博',
      tw: '匹配{1}的微博',
      en: 'Feeds contain text “{1}”',
    },
  });

  class RegexFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function regexFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.text.full(feed);
        const regexen = rule.ref.items.getConfigCompiled();
        const matches = regexen.some(regex => regex.test(text));
        if (matches) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  const regexEscaped = function (str) {
    return str.replace(/[.*+?^${}()|[\]/\\]/g, '\\$&');
  };

  const renderFastItem = function (item) {
    const container = document.createElement('span');
    const [pre, post] = i18n.regexFastDescription.split('{1}');
    container.appendChild(document.createTextNode(pre));
    const input = document.createElement('input');
    container.appendChild(input);
    container.appendChild(document.createTextNode(post));
    if (item.value.full.length === 1) {
      input.value = item.value = '/' + regexEscaped(item.value.full[0]) + '/mu';
    } else {
      input.value = item.value = '/^' + item.value.full
        .map(value => `(?=.*${regexEscaped(value)})`).join('') + '/mu';
    }
    input.addEventListener('input', event => {
      item.value = input.value;
    });
    return container;
  };

  rule.groups({
    baseClass: RegexFeedRule,
    tab: 'content',
    key: 'regex',
    type: 'regexen',
    title: () => i18n.contentTextGroupTitle,
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
      types: [['multitext'], ['text']],
      radioGroup: 'text',
      render: renderFastItem,
    },
  });

}());
