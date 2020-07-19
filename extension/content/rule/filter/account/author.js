; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;
  const init = yawf.init;

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
    accountAuthorReason: {
      cn: '作者 @{1}',
      tw: '作者 @{1}',
      en: 'posted by @{1}',
    },
  });

  class AuthorFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function authorFilterFeedFilter(/** @type {Element} */feed) {
        const oid = init.page.$CONFIG.oid;
        const [author] = feedParser.author.id(feed);
        const [fauthor] = feedParser.fauthor.id(feed);
        // 个人主页不按照作者隐藏（否则就会把所有东西都藏起来……）
        const pageType = init.page.type();
        const isShowRule = rule.feedAction === 'show';
        if ((fauthor || author) === oid && !isShowRule && pageType === 'profile') return null;
        const accounts = rule.ref.items.getConfig();
        const ignoreFastAuthor = pageType === 'group' && !isShowRule;
        const ignoreAuthor = ignoreFastAuthor && !feedParser.isFast(feed);
        if (!ignoreAuthor) {
          const contain = accounts.find(account => account.id === author);
          if (contain) {
            const reason = i18n.accountAuthorReason.replace('{1}', () => feedParser.author.name(feed));
            return { result: rule.feedAction, reason };
          }
        }
        if (!ignoreFastAuthor) {
          const fcontain = accounts.find(account => account.id === fauthor);
          if (fcontain) {
            const reason = i18n.accountAuthorReason.replace('{1}', () => feedParser.fauthor.name(feed));
            return { result: rule.feedAction, reason };
          }
        }
        return null;
      }, { priority: this.priority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: AuthorFeedRule,
    tab: 'author',
    key: 'id',
    version: 1,
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
      types: [['author', 'account'], ['original', 'mention', 'commentuser']],
      radioGroup: 'author',
      render: feedParser.fast.render.author,
    },
  });

}());

