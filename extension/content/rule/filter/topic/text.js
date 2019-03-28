; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const i18n = util.i18n;

  Object.assign(i18n, {
    topicGroupTitle: {
      cn: '按话题过滤',
      tw: '按話題篩選',
      en: 'Filter by Topics',
    },
    topicShow: {
      cn: '总是显示包含以下话题的微博||话题{{items}}',
      tw: '总是显示包含以下話題的微博||話題{{items}}',
      en: 'Always show feeds with these topics||topic {{items}}',
    },
    topicHide: {
      cn: '隐藏包含以下话题的微博||话题{{items}}',
      tw: '隱藏包含以下話題的微博||話題{{items}}',
      en: 'Hide feeds with these topics||topic {{items}}',
    },
    topicFold: {
      cn: '折叠包含以下话题的微博||话题{{items}}',
      tw: '折疊包含以下話題的微博||話題{{items}}',
      en: 'Fold feeds with these topics||topic {{items}}',
    },
    topicReason: {
      cn: '提到话题 {1}',
      tw: '提到話題 {1}',
      en: 'mentioned topic {1}',
    },
  });

  class TopicFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function topicFeedFilter(/** @type {Element} */feed) {
        const text = feedParser.topic.text(feed);
        const topics = rule.ref.items.getConfig();
        const contain = topics.find(topic => text.includes(topic));
        if (!contain) return null;
        const reason = i18n.topicReason.replace('{1}', () => contain);
        return { result: rule.feedAction, reason };
      }, { priority: this.filterPriority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: TopicFeedRule,
    tab: 'topic',
    key: 'text',
    version: 1,
    type: 'topics',
    title: () => i18n.topicGroupTitle,
    details: {
      hide: {
        title: () => i18n.topicHide,
      },
      show: {
        title: () => i18n.topicShow,
      },
      fold: {
        title: () => i18n.topicFold,
      },
    },
    fast: {
      types: [['topic'], []],
      radioGroup: 'topic',
      render: feedParser.fast.render.topic,
    },
  });

}());
