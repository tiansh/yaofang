; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;

  const author = yawf.rules.author;

  const i18n = util.i18n;

  Object.assign(i18n, {
    accountAuthorGroupTitle: {
      cn: '按作者过滤',
      tw: '按作者篩選',
      en: 'Filter by Author',
    },
    accountAuthorShow: {
      cn: '总是显示以下作者的微博||作者{{items}}',
      tw: '總是顯示以下作者的微博||作者{{items}}',
      en: 'Always show feeds from these authors||author {{items}}',
    },
    accountAuthorHide: {
      cn: '隐藏以下作者的微博||作者{{items}}',
      tw: '隱藏以下作者的微博||作者{{items}}',
      en: 'Hide feeds from these authors||author {{items}}',
    },
    accountAuthorFold: {
      cn: '折叠以下作者的微博||作者{{items}}',
      tw: '折疊以下作者的微博||作者{{items}}',
      en: 'Fold feeds from these authors||author {{items}}',
    },
  });

  class AuthorFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function authorFilterFeedFilter(/** @type {Element} */feed) {
        const [author] = feedParser.author.id(feed);
        const accounts = rule.ref.items.getConfig();
        const contain = accounts.find(account => account.id === author);
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }


  rule.groups({
    baseClass: AuthorFeedRule,
    tab: 'author',
    key: 'id',
    type: 'users',
    title: () => i18n.accountAuthorGroupTitle,
    details: {
      hide: {
        title: () => i18n.accountAuthorHide,
      },
      show: {
        title: () => i18n.accountAuthorShow,
      },
      fold: {
        title: () => i18n.accountAuthorFold,
      },
    },
    fast: {
      types: [['author', 'account'], ['original', 'mention']],
      radioGroup: 'auther',
      render: feedParser.fast.render.account,
    },
  });

}());

