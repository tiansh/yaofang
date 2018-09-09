; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.moreContentGroupTitle = {
    cn: '隐藏以下微博 - 特定内容',
    tw: '隱藏以下內容 - 某些内容',
    en: 'Hide following content - Certain Content',
  };

  const content = more.content = {};
  content.content = rule.Group({
    id: 'content',
    parent: more.more,
    template: () => i18n.moreContentGroupTitle,
  });

  i18n.multipleTopicsFeedFilter = {
    cn: '正文中提到|至少{{num}}个话题的微博{{i}}',
    tw: '正文中提到|至少{{num}}個話題的微博{{i}}',
    en: 'Feeds with | at least {{num}} topics in its content {{i}}',
  };

  content.multipleTopics = rule.Rule({
    id: 'multipleTopics',
    parent: content.content,
    template: () => i18n.multipleTopicsFeedFilter,
    ref: {
      num: {
        type: 'range',
        min: 3,
        max: 10,
        initial: 5,
      },
      i: {
        type: 'bubble',
        icon: 'warn',
        template: () => i18n.sidebarShowMessagesWarning,
      },
    },
    init() {
      const rule = this;
      filter.feed.add(function multipleTopicsFilter(feed) {
        if (!rule.isEnabled()) return null;
        const limit = rule.ref.num.getConfig();
        // TODO 把识别各类内容的逻辑独立出来
        // 这部分逻辑要重写
        const topics = feed.querySelectorAll('.a_topic');
        if (topics.length >= limit) return 'hidden';
        return null;
      }, { priority: 1e6 });
    },
  });

}());
