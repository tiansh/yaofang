; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const content = yawf.rules.content;

  const i18n = util.i18n;
  i18n.contentTextGroupTitle = {
    cn: '按内容过滤',
    tw: '按內容篩選',
    en: 'Filter by Content',
  };

  const text = content.text = {};
  text.text = rule.Group({
    parent: content.content,
    template: () => i18n.contentTextGroupTitle,
  });

  i18n.textContentHide = {
    cn: '隐藏包含以下内容的微博||关键词{{text}}',
    tw: '隱藏包含以下內容的微博||關鍵字{{text}}',
    en: 'Hide feeds with these content||keyword {{text}}',
  };

  text.hide = rule.Rule({
    id: 'ad_feed',
    parent: text.text,
    ref: {
      text: {
        type: 'strings',
      },
    },
    always: true,
    template: () => i18n.textContentHide,
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
        if (contain) return 'hidden';
        return null;
      }, { priority: 1e6 });
    },
  });

}());
