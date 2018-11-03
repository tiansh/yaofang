; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const feedParser = yawf.feed;

  const author = yawf.rules.author;

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
    accountAuthorForwardFastDescription: {
      cn: '作者是“@{1}”的转发微博',
      tw: '作者是「@{1}」的轉發微博',
      en: 'Feeds by "@{1}"',
    },
  });

  class AuthorForwardFeedRule extends rule.class.Rule {
    constructor(item) {
      super(item);
    }
    init() {
      const rule = this;
      filter.feed.add(function authorFilterFeedFilter(/** @type {Element} */feed) {
        if (!feedParser.isForward(feed)) return null;
        const [author] = feedParser.author.id(feed);
        const accounts = rule.ref.items.getConfig();
        const contain = accounts.find(account => account.id === author);
        if (contain) return rule.feedAction;
        return null;
      }, { priority: this.filterPriority });
    }
  }

  const renderForwardFastItem = function (item) {
    const container = document.createElement('span');
    const message = i18n.accountAuthorForwardFastDescription.replace('{1}', () => item.value.name);
    container.appendChild(document.createTextNode(message));
    return container;
  };

  rule.groups({
    baseClass: AuthorForwardFeedRule,
    tab: 'author',
    key: 'forward.id',
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
      types: [[], ['author', 'original', 'mention', 'account']],
      radioGroup: 'auther',
      render: renderForwardFastItem,
    },
  });


}());

