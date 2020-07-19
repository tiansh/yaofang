; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const i18n = util.i18n;

  Object.assign(i18n, {
    accountAuthorForwardGroupTitle: {
      cn: '按作者过滤转发微博',
      tw: '按作者篩選轉發微博',
      en: 'Filter by Forwarding Author',
    },
    accountAuthorForwardShow: {
      cn: '总是显示以下作者转发的微博||帐号{{items}}',
      tw: '总是显示以下作者轉發的微博||帳號{{items}}',
      en: 'Always show feeds from these authors\' forwarding||author {{items}}',
    },
    accountAuthorForwardHide: {
      cn: '总是隐藏以下作者转发的微博||帐号{{items}}',
      tw: '总是隱藏以下作者轉發的微博||帳號{{items}}',
      en: 'Hide feeds from these authors\' forwarding||author {{items}}',
    },
    accountAuthorForwardFold: {
      cn: '折叠以下作者转发的微博||帐号{{items}}',
      tw: '折叠以下作者轉發的微博||帳號{{items}}',
      en: 'Fold feeds from these authors\' forwarding||author {{items}}',
    },
    accountAuthorForwardReason: {
      cn: '由 @{1} 转发',
      tw: '由 @{1} 轉發',
      en: 'forwarded by @{1}',
    },
  });

  class AuthorForwardFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      observer.feed.filter(function authorFilterFeedFilter(/** @type {Element} */feed) {
        const authors = [];
        // 如果一条微博是传统的转发微博，转发作者计入在内
        // 如果一条微博是快转微博，被快转的微博如果是转发微博，被快转的微博的作者同样计入在内
        if (feedParser.isForward(feed)) {
          const [id] = feedParser.author.id(feed);
          const [name] = feedParser.author.name(feed);
          authors.push({ id, name });
        }
        // 如果一条微博是快转微博，快转的作业计入在内
        if (feedParser.isFast(feed)) {
          const [id] = feedParser.fauthor.id(feed);
          const [name] = feedParser.fauthor.name(feed);
          authors.push({ id, name });
        }
        if (!authors.length) return null;
        const accounts = rule.ref.items.getConfig();
        const reasonUser = authors.find(author => accounts.some(account => author.id === account.id));
        if (!reasonUser) return null;
        const reason = i18n.accountAuthorForwardReason.replace('{1}', () => reasonUser.name);
        return { result: rule.feedAction, reason };
      }, { priority: this.priority });
      this.ref.items.addConfigListener(() => { observer.feed.rerun(); });
    }
  }

  rule.groups({
    baseClass: AuthorForwardFeedRule,
    tab: 'author',
    key: 'forward_id',
    version: 1,
    type: 'users',
    title: () => i18n.accountAuthorForwardGroupTitle,
    details: {
      hide: {
        title: () => i18n.accountAuthorForwardHide,
      },
      show: {
        title: () => i18n.accountAuthorForwardShow,
      },
      fold: {
        title: () => i18n.accountAuthorForwardFold,
      },
    },
    fast: {
      types: [[], ['author', 'original', 'mention', 'account', 'commentuser']],
      radioGroup: 'author',
      render: feedParser.fast.render.forward,
    },
  });


}());

