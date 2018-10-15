; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const content = yawf.rules.content;

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
      tw: '折叠包含以下內容的微博||關鍵字{{items}}',
      en: 'Fold feeds with these content||keyword {{items}}',
    },
    contentTextContextTitle: {
      cn: '过滤包含“{1}”的微博',
      tw: '篩選包含「{1}」的微博',
      en: 'Create filter for “{1}”',
    },
    textFastDescription: {
      cn: '包含“{1}”的微博',
      tw: '包含「{1}」的微博',
      en: 'Feeds contain text “{1}”',
    },
  });

  class TextFeedRule extends rule.class.Rule {
    constructor(item) {
      item.ref.items.parseFastItem = async function (value, type) {
        if (type === 'text') return [value];
        return [];
      };
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function textFeedFilter(/** @type {Element} */feed) {
        // FIXME 这段临时的，之后再提出去详细写
        const contentItems = feed.querySelectorAll([
          '[node-type="feed_list_content"]',
          '[node-type="feed_list_reason"]',
        ].join(','));
        const text = [...contentItems].map(item => item.textContent).join('\n');
        const keywords = rule.ref.items.getConfig();
        const contain = keywords.some(keyword => text.includes(keyword));
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  const renderFastItem = function (item) {
    const container = document.createElement('span');
    const [pre, post] = i18n.textFastDescription.split('{1}');
    container.appendChild(document.createTextNode(pre));
    const input = document.createElement('input');
    container.appendChild(input);
    container.appendChild(document.createTextNode(post));
    input.value = item.value;
    input.addEventListener('input', event => {
      item.value = input.value;
    });
    return container;
  };

  rule.groups({
    baseClass: TextFeedRule,
    tab: 'content',
    key: 'text',
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
      types: [['text'], []],
      render: renderFastItem,
    },
  });

}());
