; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;
  const request = yawf.request;

  const mention = yawf.rules.mention;

  const i18n = util.i18n;

  Object.assign(i18n, {
    accountMentionGroupTitle: {
      cn: '按提到过滤',
      tw: '按提到篩選',
      en: 'Filter by Mention',
    },
    accountMentionShow: {
      cn: '总是显示提到以下帐号的微博||作者{{items}}',
      tw: '總是顯示提到以下帳號的微博||作者{{items}}',
      en: 'Always show feeds mentioned these accounts||mention {{items}}',
    },
    accountMentionHide: {
      cn: '隐藏提到以下帐号的微博||作者{{items}}',
      tw: '隱藏提到以下帳號的微博||作者{{items}}',
      en: 'Hide feeds mentioned these accounts||mention {{items}}',
    },
    accountMentionFold: {
      cn: '折叠提到以下帐号的微博||作者{{items}}',
      tw: '折疊提到以下帳號的微博||作者{{items}}',
      en: 'Fold feeds mentioned these accounts||mention {{items}}',
    },
    accountMentionReason: {
      cn: '提到了 @{1}',
      tw: '提到了 @{1}',
      en: 'mentioned @{1}',
    },
  });

  class MentionFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function mentionFilterFeedFilter(/** @type {Element} */feed) {
        const mentions = new Set(feedParser.mention.name(feed));
        const accounts = rule.ref.items.getConfig();
        const contain = accounts.find(account => mentions.has(account));
        if (!contain) return;
        const reason = i18n.accountMentionReason.replace('{1}', () => contain);
        return { result: rule.feedAction, reason };
      }, { priority: this.filterPriority });
    }
  }

  rule.groups({
    baseClass: MentionFeedRule,
    tab: 'mention',
    key: 'name',
    type: 'usernames',
    title: () => i18n.accountMentionGroupTitle,
    details: {
      hide: {
        title: () => i18n.accountMentionHide,
      },
      show: {
        title: () => i18n.accountMentionShow,
      },
      fold: {
        title: () => i18n.accountMentionFold,
      },
    },
    fast: {
      types: [['mention', 'account'], ['author', 'original']],
      radioGroup: 'mention',
      render: feedParser.fast.render.mention,
    },
  });

}());

