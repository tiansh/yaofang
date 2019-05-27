; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;
  const request = yawf.request;

  const rules = yawf.rules;
  const original = rules.original;

  const i18n = util.i18n;

  Object.assign(i18n, {
    accountOriginalGroupTitle: {
      cn: '按原作者过滤',
      tw: '按原作者篩選',
      en: 'Filter by Original',
    },
    accountOriginalShow: {
      cn: '总是显示转发自以下帐号的微博||原作者{{items}}',
      tw: '總是顯示轉發自以下帳號的微博||原作者{{items}}',
      en: 'Always show feeds forwarded from these authors||original {{items}}',
    },
    accountOriginalHide: {
      cn: '隐藏转发自以下帐号的微博||原作者{{items}}',
      tw: '隱藏轉發自以下帳號的微博||原作者{{items}}',
      en: 'Hide feeds forwarded from these authors||original {{items}}',
    },
    accountOriginalFold: {
      cn: '折叠转发自以下帐号的微博||原作者{{items}}',
      tw: '折疊轉發自以下帳號的微博||原作者{{items}}',
      en: 'Fold feeds forwarded from these authors||original {items}}',
    },
    accountOriginalDiscover: {
      cn: '按原创作者过滤的规则对发现页面的作者生效',
      tw: '按原創作者過濾的規則對發現頁面的作者生效',
      en: 'Rules filter by originals apply to authors in discovery pages',
    },
    accountOriginalReason: {
      cn: '转发自 @{1}',
      tw: '轉發自 @{1}',
      en: 'forwarded from @{1}',
    },
    accountOriginalFollower: {
      cn: '隐藏转发自|粉丝数量超过{{count}}万的博主的微博{{i}}||例外帐号{{account}}',
      tw: '隱藏轉發自|粉絲數量超過{{count}}萬的博主的微博{{i}}||例外帐号{{account}}',
      en: 'Hide feeds forwarded from authors with | more than {{count}}0,000 fans{{i}}||Exception {{account}}',
    },
    accountOriginalFollowerDetail: {
      cn: '发现页面作者不计入。',
    },
  });

  const additionalRules = function () {
    original.id.discover = rule.Rule({
      id: 'filter_original_discover',
      version: 1,
      parent: original.id.id,
      template: () => i18n.accountOriginalDiscover,
    });
  };

  class OriginalFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function originalFilterFeedFilter(/** @type {Element} */feed) {
        const original = new Set(feedParser.original.id(feed));
        if (rules.original.id.discover.isEnabled() && init.page.type() === 'discover') {
          feedParser.author.id(feed).forEach(id => original.add(id));
        }
        const accounts = rule.ref.items.getConfig();
        const contain = accounts.find(account => original.has(account.id));
        if (!contain) return null;
        const reason = i18n.accountOriginalReason.replace('{1}', () => feedParser.original.name(feed));
        return { result: rule.feedAction, reason };
      }, { priority: this.priority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: OriginalFeedRule,
    tab: 'original',
    key: 'id',
    type: 'users',
    version: 1,
    title: () => i18n.accountOriginalGroupTitle,
    details: {
      hide: {
        title: () => i18n.accountOriginalHide,
      },
      show: {
        title: () => i18n.accountOriginalShow,
      },
      fold: {
        title: () => i18n.accountOriginalFold,
      },
    },
    before: {
      show: additionalRules,
    },
    fast: {
      types: [['original', 'account'], ['author', 'mention', 'commentuser']],
      radioGroup: 'original',
      render: feedParser.fast.render.original,
    },
  });

  original.id.follower = rule.Rule({
    id: 'filter_original_follower',
    version: 1,
    parent: original.id.id,
    template: () => i18n.accountOriginalFollower,
    ref: {
      count: { type: 'range', min: 1, max: 100, initial: 10 },
      account: { type: 'users' },
    },
    init() {
      const rule = this;
      observer.feed.filter(async function originalFollowerFeedFilter(/** @type {Element} */feed) {
        if (!rule.isEnabled()) return null;
        const original = feedParser.original.id(feed);
        const accounts = rule.ref.account.getConfig();
        const filtered = original.filter(id => !accounts.find(user => user.id === id));
        const followers = await Promise.all(filtered
          .map(id => request.userInfo({ id }).then(user => user.follower))
        );
        const limit = rule.ref.count.getConfig() * 1e4;
        const match = followers.some(i => i >= limit);
        if (!match) return null;
        return { result: 'hide' };
      }, { priority: this.priority });
      this.addConfigListener(() => { observer.feed.rerun(); });
      this.ref.account.addConfigListener(() => { observer.feed.rerun(); });
      this.ref.count.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

}());
