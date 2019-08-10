; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.moreLinkGroupTitle = {
    cn: '隐藏以下微博 - 正文链接',
    tw: '隱藏以下內容 - 正文連結',
    en: 'Hide following link - Content Links',
  };

  const link = more.link = {};
  link.link = rule.Group({
    parent: more.more,
    template: () => i18n.moreLinkGroupTitle,
  });

  Object.assign(i18n, {
    feedWithLink: { cn: '带有{}的微博', tw: '帶有{}的微博', en: 'Feeds contain {}' },
    feedWithLinkPlace: { cn: '位置链接', tw: '位置連結', en: 'links of places' },
    feedWithLinkMovie: { cn: '电影链接', tw: '電影連結', en: 'links of movies' },
    feedWithLinkBook: { cn: '图书链接', tw: '圖書連結', en: 'links of books' },
    feedWithLinkTopic: { cn: '超话链接', tw: '超話連結', en: 'links of super topics' },
    feedWithLinkMusic: { cn: '音乐链接', tw: '音樂連結', en: 'links of musics' },
    feedWithLinkStock: { cn: '股票链接', tw: '股票連結', en: 'links of stocks' },
  });

  ; (function (linkTypes) {
    Object.keys(linkTypes).sort().forEach(id => {
      const { type, name, recognizer } = linkTypes[id];
      const pascalCaseType = type.replace(/^./, c => c.toUpperCase());
      link[type] = rule.Rule({
        id: `filter_${pascalCaseType}`,
        version: 30,
        parent: link.link,
        template: () => i18n.feedWithLink.replace('{}', name),
        init() {
          const rule = this;
          observer.feed.filter(function feedWithPlaceFilter(feed) {
            if (!rule.isEnabled()) return null;
            if (init.page.type() === type) return null;
            if (feed.querySelector(`a[suda-uatrack*="1022-${type}"]`)) return 'hide';
            if (recognizer && recognizer(feed)) return 'hide';
            return null;
          });
          this.addConfigListener(() => { observer.feed.rerun(); });
        },
      });
    });
  }({
    100101: {
      type: 'place',
      name: () => i18n.feedWithLinkPlace,
    },
    100120: {
      type: 'movie',
      name: () => i18n.feedWithLinkMovie,
    },
    100202: {
      type: 'book',
      name: () => i18n.feedWithLinkBook,
    },
    100808: {
      type: 'topic',
      name: () => i18n.feedWithLinkTopic,
      recognizer: feed => {
        const source = feed.querySelector('a[action-type="app_source"][href^="https://weibo.com/p/100808"]');
        if (source) return true;
        return false;
      },
    },
    101515: {
      type: 'music',
      name: () => i18n.feedWithLinkMusic,
    },
    230677: {
      type: 'stock',
      name: () => i18n.feedWithLinkStock,
    },
  }));

}());
