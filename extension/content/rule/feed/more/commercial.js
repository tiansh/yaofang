; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.moreCommercialGroupTitle = {
    cn: '隐藏以下微博 - 广告/商品',
    tw: '隱藏以下內容 - 廣告/商品',
    en: 'Hide following content - Ad / Promotion',
  };

  const commercial = more.commercial = {};
  commercial.commercial = rule.Group({
    parent: more.more,
    template: () => i18n.moreCommercialGroupTitle,
  });

  i18n.adFeedFilter = {
    cn: '推广微博/粉丝通微博/品牌速递/好友赞过的微博',
    tw: '推廣微博/粉絲通微博/品牌速遞/好友贊過的微博',
    en: 'Ad Weibo / Instered not followed Weibo',
  };

  commercial.ad = rule.Rule({
    id: 'ad_feed',
    parent: commercial.commercial,
    template: () => i18n.adFeedFilter,
    init() {
      const rule = this;
      filter.feed.add(function adFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        // 修改这里时请注意，悄悄关注也会显示关注按钮，但是相关微博不应被隐藏
        if (feed.getAttribute('feedtype') === 'ad') return 'hidden';
        if (feed.querySelector('[action-type="feed_list_ad"]')) return 'hidden';
        if (feed.querySelector('a[href*="//adinside.weibo.cn/"]')) return 'hidden';
        if (feed.querySelector('[diss-data*="feedad"]')) return 'hidden';
        if (feed.querySelector('[suda-uatrack*="insert_feed"]')) return 'hidden';
        if (feed.querySelector('[suda-uatrack*="negativefeedback]')) return 'hidden';
        return null;
      }, { priority: 1e6 });
    },
  });

}());
