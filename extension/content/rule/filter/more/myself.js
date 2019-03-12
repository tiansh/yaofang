; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;
  const init = yawf.init;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.otherWhitelistTitle = {
    cn: '显示以下内容（不计入白名单）',
    hk: '顯示以下內容（不計入白名單）',
    tw: '顯示以下內容（不計入白名單）',
    en: 'Show following content (not regard as whitelist)',
  };

  const showthese = more.showthese = {};
  showthese.showthese = rule.Group({
    parent: more.more,
    template: () => i18n.otherWhitelistTitle,
  });

  i18n.showMyFeedDetail = {
    cn: '自己的微博',
    hk: '自己的微博',
    tw: '自己的微博',
    en: 'Feeds by myself',
  };

  showthese.showMyFeed = rule.Rule({
    id: 'filter_my_feed',
    version: 1,
    parent: showthese.showthese,
    template: () => i18n.showMyFeedDetail,
    initial: true,
    init() {
      const rule = this;
      observer.feed.filter(function showMyFeed(feed) {
        if (!rule.isEnabled()) return null;
        const me = init.page.$CONFIG.uid;
        const author = feedParser.author.id(feed);
        if (me === author) return 'showme';
        return null;
      }, { priority: 1e4 });
    },
  });

  i18n.showMyOriginalDetail = {
    cn: '自己微博的转发',
    hk: '自己微博的轉發',
    tw: '自己微博的轉發',
    en: 'Forward of my Feeds',
  };

  showthese.showMyOriginal = rule.Rule({
    id: 'filter_my_original',
    version: 1,
    parent: showthese.showthese,
    template: () => i18n.showMyOriginalDetail,
    init() {
      const rule = this;
      observer.feed.filter(function showMyOriginal(feed) {
        if (!rule.isEnabled()) return null;
        const me = init.page.$CONFIG.uid;
        const original = feedParser.original.id(feed);
        if (me === original) return 'showme';
        return null;
      }, { priority: 1e4 });
    },
  });

  i18n.showMentionMeDetail = {
    cn: '提到自己的微博',
    hk: '提到自己的微博',
    tw: '提到自己的微博',
    en: 'Feeds mentioned myself',
  };

  showthese.showMentionMe = rule.Rule({
    id: 'filter_mention_me',
    version: 1,
    parent: showthese.showthese,
    template: () => i18n.showMentionMeDetail,
    init() {
      const rule = this;
      observer.feed.filter(function adFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        const me = init.page.$CONFIG.nick;
        const mentions = feedParser.mention.name(feed);
        if (mentions.includes(me)) return 'showme';
        return null;
      }, { priority: 1e4 });
    },
  });

}());
