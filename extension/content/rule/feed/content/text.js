; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const content = yawf.rules.content;

  const i18n = util.i18n;
  i18n.contentTextGroupTitle = {
    cn: '按内容关键词过滤',
    tw: '按內容關鍵字篩選',
    en: 'Filter by Content Keywords',
  };

  const text = content.text = {};
  text.text = rule.Group({
    parent: content.content,
    template: () => i18n.contentTextGroupTitle,
  });

  Object.assign(i18n, {
    textContentShow: {
      cn: '总是显示包含以下内容的微博||关键词{{text}}',
      tw: '总是显示包含以下內容的微博||關鍵字{{text}}',
      en: 'Always show feeds with these content||keyword {{text}}',
    },
    textContentHide: {
      cn: '隐藏包含以下内容的微博||关键词{{text}}',
      tw: '隱藏包含以下內容的微博||關鍵字{{text}}',
      en: 'Hide feeds with these content||keyword {{text}}',
    },
    textContentFold: {
      cn: '折叠包含以下内容的微博||关键词{{text}}',
      tw: '折叠包含以下內容的微博||關鍵字{{text}}',
      en: 'Fold feeds with these content||keyword {{text}}',
    },
  });

  class TextFeedRule extends rule.class.Rule {
    constructor(item) {
      item.always = true;
      item.ref = item.ref || {};
      item.ref.text = { type: 'strings' };
      item.feedAction = item.id;
      item.parent = text.text;
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
        const keywords = rule.ref.text.getConfig();
        const contain = keywords.some(keyword => text.includes(keyword));
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  text.show = new TextFeedRule({
    id: 'show',
    priority: 1e5,
    template: () => i18n.textContentShow,
  });

  text.hide = new TextFeedRule({
    id: 'hide',
    priority: 0,
    template: () => i18n.textContentHide,
  });

  text.fold = new TextFeedRule({
    id: 'fold',
    priority: -1e5,
    template: () => i18n.textContentFold,
  });

}());
