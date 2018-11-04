; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;

  const source = yawf.rules.source;

  const i18n = util.i18n;

  Object.assign(i18n, {
    sourceGroupTitle: {
      cn: '按来源过滤',
      tw: '按來源篩選',
      en: 'Filter by Sources',
    },
    sourceShow: {
      cn: '总是显示来自以下来源的微博||来源{{items}}',
      tw: '总是显示來自以下來源的微博||來源{{items}}',
      en: 'Always show feeds from these sources||source {{items}}',
    },
    sourceHide: {
      cn: '隐藏来自以下来源的微博||来源{{items}}',
      tw: '隱藏來自以下來源的微博||來源{{items}}',
      en: 'Hide feeds from these sources||source {{items}}',
    },
    sourceFold: {
      cn: '折叠来自以下来源的微博||来源{{items}}',
      tw: '折疊來自以下來源的微博||來源{{items}}',
      en: 'Fold feeds from these sources||source {{items}}',
    },
  });

  class SourceFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function sourceFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.source.text(feed);
        const sources = rule.ref.items.getConfig();
        const contain = sources.some(source => text.includes(source));
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  rule.groups({
    baseClass: SourceFeedRule,
    tab: 'source',
    key: 'text',
    type: 'strings',
    title: () => i18n.sourceGroupTitle,
    details: {
      hide: {
        title: () => i18n.sourceHide,
      },
      show: {
        title: () => i18n.sourceShow,
      },
      fold: {
        title: () => i18n.sourceFold,
      },
    },
    fast: {
      types: [['source'], []],
      radioGroup: 'source',
      render: feedParser.fast.render.source,
    },
  });

}());
