; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;
  const init = yawf.init;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.moreCommercialGroupTitle = {
    cn: '隐藏以下微博 - 广告/商品/推荐',
    tw: '隱藏以下內容 - 廣告/商品/推薦',
    en: 'Hide following content - Ad / Promotion / Recommend',
  };

  const commercial = more.commercial = {};
  commercial.commercial = rule.Group({
    parent: more.more,
    template: () => i18n.moreCommercialGroupTitle,
  });

  i18n.adFeedFilter = {
    cn: '推广微博/粉丝通微博/品牌速递/好友赞过的微博/内容推荐 {{i}}',
    tw: '推廣微博/粉絲通微博/品牌速遞/好友贊過的微博/內容推薦 {{i}}',
    en: 'Ad Weibo / Inserted not followed Weibo {{i}}',
  };
  i18n.adFeedFilterDetail = {
    cn: '这些微博一般出现在您的首页，带有“推荐”“好友赞过”等标记，但大多来自您并未关注的人。',
  };

  commercial.ad = rule.Rule({
    v7Support: true,
    id: 'filter_ad_feed',
    version: 109,
    parent: commercial.commercial,
    template: () => i18n.adFeedFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.adFeedFilterDetail },
    },
    init() {
      const rule = this;
      observer.feed.filter(function adFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        // TODO 我也不确定这个属性是做什么的
        // if (feed.promotion) console.log('FILTERTEST promotion: %o (%o)', feed.promotion, feed);
        // if (feed.attitude_dynamic_adid) console.log('FILTERTEST attitude_dynamic_adid: %o (%o)', feed.attitude_dynamic_adid, feed);
        // 未关注的人的微博
        if (['home', 'group'].includes(init.page.type()) && !feed.user.following) return 'hide';
        // 某某赞过的微博
        if (feed.title?.type === 'likerecommend') return 'hide';
        // 热推 / 广告之类
        if (feed.content_auth === 5) return 'hide';
        if (feed.retweeted_status?.content_auth === 5) return 'hide';
        return null;
      }, { priority: 1e6 });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  i18n.fansTopFeedFilter = {
    cn: '粉丝头条 {{i}}',
    tw: '粉絲頭條 {{i}}',
    en: 'Fans top (headline weibo) {{i}}',
  };
  i18n.fansTopFeedFilterDetail = {
    cn: '粉丝头条会显示在首页消息流的顶部，一般带有“热门”等标记。粉丝头条是新浪微博官方的一项推广产品，使用粉丝头条的微博可在 24 小时内出现在所有粉丝首页的第一位。粉丝头条微博总是来自于您关注的人。',
  };

  commercial.fansTop = rule.Rule({
    v7Support: true,
    id: 'filter_fans_top',
    version: 1,
    parent: commercial.commercial,
    template: () => i18n.fansTopFeedFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.fansTopFeedFilterDetail },
    },
    init() {
      const rule = this;
      observer.feed.filter(function fansTopFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        if (feed.promotion?.adtype === 8) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  i18n.weiboProductFeedFilter = {
    cn: '带有微博橱窗商品链接的微博{{i}}',
    tw: '帶有微博櫥窗商品連接的微博{{i}}',
    en: 'Weibo with link to weibo shop {{i}}',
  };
  i18n.weiboProductFeedFilterDetail = {
    cn: '带有微博橱窗商品链接的微博，点击链接可以到商品的购买页面。勾选以隐藏此类微博。',
  };

  i18n.weiboProductLikeFeedFilter = {
    cn: '带有商品链接的微博{{i}}',
    tw: '帶有商品鏈接的微博{{i}}',
    en: 'Weibo with link to weibo shop / taobao {{i}}',
  };

  commercial.weiboProductLike = rule.Rule({
    v7Support: true,
    id: 'filter_weibo_product_like',
    version: 75,
    parent: commercial.commercial,
    template: () => i18n.weiboProductLikeFeedFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.weiboProductLikeFeedFilterDetail },
    },
    init() {
      const rule = this;
      observer.feed.filter(function taobaoProductFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        if (Array.isArray(feed.url_struct)) {
          if (feed.url_struct.find(url => /taobao\.png$/.test(url.url_type_pic))) return 'hide';
          if (feed.url_struct.find(url => url.object_type === 'product')) return 'hide';
          if (feed.url_struct.find(url => /^https:\/\/m\.tb\.cn\//.test(url.long_url))) return 'hide';
          if (feed.url_struct.find(url => /buy\.png$/.test(url.url_type_pic))) return 'hide';
          if (feed.url_struct.find(url => /^https:\/\/shop\.sc\.weibo\.com\//.test(url.long_url))) return 'hide';
          if (feed.url_struct.find(url => /shop_sc_weibo/.test(url.actionlog?.oid))) return 'hide';
        }
        return null;
      });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  i18n.weiboPayGiftFeedFilter = {
    cn: '带有微博支付积分礼品兑换卡片的微博{{i}}',
    tw: '帶有微博支付積分禮品兌換卡片的微博{{i}}',
    en: 'Weibo with Weibo pay with points gift exchange card{{i}}',
  };
  i18n.weiboPayGiftFeedFilterDetail = {
    cn: '微博支付积分指通过在微博中消费（如购买会员）产生的积分，并非微博等级经验值，可以用于兑换礼品（礼品一般是优惠券或抽奖）。勾选本选项以隐藏带有此类兑换信息的卡片的微博。',
  };

  commercial.weiboPay = rule.Rule({
    id: 'filter_weibo_pay',
    version: 1,
    parent: commercial.commercial,
    template: () => i18n.weiboPayGiftFeedFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.weiboPayGiftFeedFilterDetail },
    },
    init() {
      const rule = this;
      observer.feed.filter(function weiboProductFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        if (feed.querySelector('div[action-data*="objectid=1042025:"]')) return 'hide';
        if (feed.querySelector('a[suda-uatrack*="1042025-webpage"]')) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  i18n.userLikeFeedFilter = {
    cn: '混入个人主页的赞过的微博',
    hk: '混入個人主頁的贊過的微博',
    tw: '混入個人主頁的贊過的微博',
    en: 'Weibo Liked in Personal page',
  };
  i18n.userLikeFeedFilterDetail = {
    cn: '个人主页消息流中混入的微博。',
  };

  commercial.userLike = rule.Rule({
    v7Support: true,
    id: 'filter_user_like',
    version: 1,
    parent: commercial.commercial,
    template: () => i18n.userLikeFeedFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.userLikeFeedFilterDetail },
    },
    init() {
      const rule = this;
      observer.feed.filter(function userLikeFeedFilter(feed) {
        if (!rule.isEnabled()) return null;
        if (init.page.type() !== 'profile') return null;
        const oid = String(init.page.route.params.id);
        if (!oid) return null;
        const [author] = feedParser.author.id(feed);
        const [fauthor] = feedParser.fauthor.id(feed);
        if (String(fauthor || author) !== oid) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  i18n.fakeWeiboFilter = {
    cn: '混入微博列表的推荐内容（好友推荐、热门话题）{{<i>}}',
    hk: '混入微博列表的推薦內容（好友推薦、熱門話題）{{<i>}}',
    tw: '混入微博列表的推薦內容（好友推薦、熱門話題）{{<i>}}',
    en: 'Other contents in Weibo list{{<i>}}',
  };
  i18n.fakeWeiboFilterDetail = {
    cn: '所有在微博与微博之间混入的其他内容，这些内容往往不是微博消息，比如“好友推荐”“热门话题”等。',
  };

  // 这些内容不是真正的消息，各类过滤规则处理这些内容可能有各种问题
  // 所以这条规则被设置为最高的优先级，而且如果关闭了这个设置项，就直接让这些东西显示出来
  commercial.fakeWeibo = rule.Rule({
    id: 'filter_fake_weibo',
    version: 1,
    parent: commercial.commercial,
    template: () => i18n.fakeWeiboFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.fakeWeiboFilterDetail },
    },
    init() {
      // const rule = this;
      observer.feed.filter(function fakeWeiboFilter(feed) {
        return null;
        // if (rule.isEnabled() && init.page.type() !== 'search') return 'hide';
        // return 'unset';
      }, { priority: 1e6 });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });


}());
