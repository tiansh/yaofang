; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

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
    sourceReason: {
      cn: '来自 {1}',
      tw: '來自 {1}',
      en: 'posted via {1}',
    },
  });

  class SourceFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function sourceFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.source.text(feed);
        if (rule.feedAction === 'show') console.log('Feed: %o, Source: %o', feed, text);
        const sources = rule.ref.items.getConfig();
        const contain = sources.some(source => text.includes(source));
        if (!contain) return null;
        const reason = i18n.sourceReason.replace('{1}', () => contain);
        return { result: rule.feedAction, reason };
      }, { priority: this.filterPriority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: SourceFeedRule,
    tab: 'source',
    key: 'text',
    version: 1,
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
