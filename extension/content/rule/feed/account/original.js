; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;

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
  });

  const discoverRule = function () {
    original.id.discover = new rule.class.Rule({
      id: 'original.discover',
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
      filter.feed.add(function originalFilterFeedFilter(/** @type {Element} */feed) {
        const original = new Set(feedParser.original.id(feed));
        if (rules.original.id.discover.isEnabled() && init.page.type === 'discover') {
          feedParser.author.id(feed).forEach(id => original.add(id));
        }
        const accounts = rule.ref.items.getConfig();
        const contain = accounts.find(account => original.has(account.id));
        if (!contain) return null;
        const reason = i18n.accountOriginalReason.replace('{1}', () => feedParser.original.name(feed));
        return { result: rule.feedAction, reason };
      }, { priority: this.filterPriority });
    }
  }

  rule.groups({
    baseClass: OriginalFeedRule,
    tab: 'original',
    key: 'id',
    type: 'users',
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
      show: discoverRule,
    },
    fast: {
      types: [['original', 'account'], ['author', 'mention']],
      radioGroup: 'original',
      render: feedParser.fast.render.original,
    },
  });

}());
