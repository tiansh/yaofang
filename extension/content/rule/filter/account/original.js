; (function () {

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
    accountOriginalDiscoverReason: {
      cn: '作者 @{1}',
      tw: '作者 @{1}',
      en: 'author @{1}',
    },
    accountOriginalFastForwardReason: {
      cn: '快转自 @{1}',
      tw: '快轉自 @{1}',
      en: 'fast forwarded from @{1}',
    },
    accountOriginalFollower: {
      cn: '隐藏转发自|粉丝数量超过{{count}}万的博主的微博||例外帐号{{account}}',
      tw: '隱藏轉發自|粉絲數量超過{{count}}萬的博主的微博||例外帐号{{account}}',
      en: 'Hide feeds forwarded from authors with | more than {{count}}0,000 fans||Exception {{account}}',
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
    get v7Support() { return true; }
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function originalFilterFeedFilter(/** @type {Element} */feed) {
        const accounts = rule.ref.items.getConfig();

        const [original] = feedParser.original.id(feed);
        if (accounts.find(account => account.id === original)) {
          const name = feedParser.original.name(feed);
          const reason = i18n.accountOriginalReason.replace('{1}', () => name);
          return { result: rule.feedAction, reason };
        }

        const pageType = init.page.type();
        const isDiscover = pageType === 'discover';
        const asDiscover = rules.original.id.discover.isEnabled() && isDiscover;
        const asFastForward = feedParser.isFast(feed);
        if (asDiscover || asFastForward) {
          const [author] = feedParser.author.id(feed);
          if (accounts.find(account => author === account.id)) {
            const name = feedParser.author.name(feed);
            if (asDiscover) {
              const reason = i18n.accountOriginalDiscoverReason.replace('{1}', () => name);
              return { result: rule.feedAction, reason };
            } else {
              const reason = i18n.accountOriginalFastForwardReason.replace('{1}', () => name);
              return { result: rule.feedAction, reason };
            }
          }
        }

        return null;
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
    v7Support: true,
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
        if (feedParser.isFast(feed)) {
          original.push(feedParser.author.id(feed));
        }
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
