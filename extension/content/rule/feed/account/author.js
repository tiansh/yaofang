; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const account = yawf.rules.account;

  const i18n = util.i18n;
  i18n.authorGroupTitle = {
    cn: '指定作者的微博',
    en: 'Feeds from these Authors',
  };

  const author = account.author = {};
  author.author = rule.Group({
    parent: account.account,
    template: () => i18n.authorGroupTitle,
  });

  Object.assign(i18n, {
    accountAuthorShow: {
      cn: '总是显示以下作者的微博||帐号{{account}}',
      tw: '总是显示以下作者的微博||帳號{{account}}',
      en: 'Always show feeds from these authors||author {{account}}',
    },
    accountAuthorHide: {
      cn: '总是隐藏以下作者的微博||帐号{{account}}',
      tw: '总是隱藏以下作者的微博||帳號{{account}}',
      en: 'Hide feeds from these authors||author {{account}}',
    },
    accountAuthorFold: {
      cn: '折叠以下作者的微博||帐号{{account}}',
      tw: '折叠以下作者的微博||帳號{{account}}',
      en: 'Fold feeds from these authors||author {{account}}',
    },
  });

  class AuthorFilterRule extends rule.class.AccountFilterRule {
    constructor(item) {
      item.parent = author.author;
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function authorFilterFeedFilter(/** @type {Element} */feed) {
        const usercard = feed.querySelector('.WB_face [usercard]').getAttribute('usercard');
        const id = new URLSearchParams(usercard).get('id');
        const accounts = rule.ref.account.getConfig();
        const contain = accounts.find(account => account.id === id);
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  author.show = new AuthorFilterRule({
    id: 'show',
    priority: 1e5,
    template: () => i18n.accountAuthorShow,
  });

  author.hide = new AuthorFilterRule({
    id: 'hide',
    priority: 0,
    template: () => i18n.accountAuthorHide,
  });

  author.fold = new AuthorFilterRule({
    id: 'fold',
    priority: -1e5,
    template: () => i18n.accountAuthorFold,
  });

}());
