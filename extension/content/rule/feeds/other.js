; (function () {

  const yawf = window.yawf;
  const init = yawf.init;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const request = yawf.request;
  const feedParser = yawf.feed;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;
  const dialog = util.dialog;
  const time = util.time;

  const details = feeds.details = {};

  i18n.feedDetailsGroupTitle = {
    cn: '细节',
    tw: '細節',
    en: 'Details',
  };

  details.details = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedDetailsGroupTitle,
  });

  Object.assign(i18n, {
    disableTagDialog: {
      cn: '屏蔽收藏微博时的添加标签对话框',
      tw: '阻擋收藏微博時的添加標籤對話方塊',
      en: 'Block the dialog after marking weibo favorite',
    },
    favoriteFailTitle: {
      cn: '收藏微博',
      en: 'Feed Favorite',
    },
    favoriteFailText: {
      cn: '收藏时发生错误',
      en: 'Error while adding favorite feeds',
    },
    favoriteFeed: {
      cn: '已收藏',
      en: 'Favorite Added',
    },
  });

  details.disableTagDialog = rule.Rule({
    id: 'feed_disable_tag_dialog',
    version: 1,
    parent: details.details,
    template: () => i18n.disableTagDialog,
    ainit() {
      document.addEventListener('click', async event => {
        if (!event.isTrusted) return;
        if (!['www.weibo.com', 'weibo.com'].includes(location.host)) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        const button = target.closest('[action-type="fl_favorite"]');
        if (!button) return;
        const isFavorite = button.getAttribute('favorite');
        if (isFavorite) return; // 不处理取消收藏的逻辑
        event.stopPropagation();
        event.preventDefault();
        const feed = feedParser.feedNode(button);
        const $CONFIG = init.page.$CONFIG;
        const success = await request.feedFavorite(feed, { $CONFIG });
        if (!success) {
          dialog.alert({
            id: 'yawf-favorite-fail',
            icon: 'warn',
            title: i18n.favoriteFailTitle,
            text: i18n.favoriteFailText,
          });
        } else {
          button.setAttribute('favorite', '1');
          const text = button.querySelector('[node-type="favorite_btn_text"]') || button;
          text.innerHTML = '<span><em class="W_ficon ficon_favorite S_spetxt">\xFB</em><em></em></span>';
          text.querySelector('em + em').textContent = i18n.favoriteFeed;
        }
      }, true);
    },
  });

  i18n.lowReadingCountWarn = {
    cn: '在自己个人主页高亮显示阅读数量|不超过{{count}}的微博',
    tw: '在自己個人主頁高亮顯示閱讀數量|不超過{{count}}的微博',
    en: 'Highlight feeds on my profile page which has | no more than {{count}} views',
  };

  details.lowReadingCountWarn = rule.Rule({
    id: 'feed_low_reading_warn',
    version: 23,
    parent: details.details,
    template: () => i18n.lowReadingCountWarn,
    ref: {
      count: {
        type: 'range',
        min: 10,
        max: 1000,
        step: 10,
        initial: 100,
      },
    },
    ainit() {
      const rule = this;
      observer.feed.onAfter(function (/** @type {Element} */feed) {
        const container = feed.closest('[id^="Pl_Official_MyProfileFeed__"]');
        if (!container) return;
        const popText = feed.querySelector('.WB_feed_handle [action-type="fl_pop"] i');
        if (!popText) return;
        const count = Number.parseInt(popText.title.match(/\d+/)[0], 10);
        const limit = rule.ref.count.getConfig();
        if (count > limit) return;
        feed.setAttribute('yawf-low-reading', count);
      });
      css.append('.WB_feed.WB_feed .WB_cardwrap[yawf-low-reading] { box-shadow: 0 0 4px red inset; }');
    },
  });

  Object.assign(i18n, {
    feedAbsoluteTimeDetail: {
      cn: '显示的时间受 [[layout_locale_timezone]] 功能影响。',
    },
  }, time.isCstEquivalent() ? {
    feedAbsoluteTime: {
      cn: '微博发布时间总是使用年月日格式',
      tw: '微博發布時間總是使用年月日格式',
      en: 'Use yyyy-mm-dd date format',
    },
  } : {
    feedAbsoluteTime: {
      cn: '微博发布时间总是使用年月日格式 {{i}}',
      tw: '微博發布時間總是使用年月日格式 {{i}}',
      en: 'Use yyyy-mm-dd date format {{i}}',
    },
  });

  details.feedAbsoluteTime = rule.Rule({
    id: 'feed_absolute_time',
    version: 60,
    parent: details.details,
    template: () => i18n.feedAbsoluteTime,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.feedAbsoluteTimeDetail },
    },
  });

  Object.assign(i18n, {
    feedLinkNewTab: {
      cn: '在新标签页打开以下链接 {{i}}||{{author}}作者/原作者|{{mention}}提到|{{topic}}话题||{{detail}}微博详情（发布时间）|{{comments}}全部评论',
    },
    feedLinkNewTabDetail: {
      cn: '按住 Ctrl 也可临时在新标签页打开。此功能依赖于 [[feed_render]]。',
    },
  });

  details.feedLinkNewTab = rule.Rule({
    weiboVersion: 7,
    id: 'feed_link_new_tab',
    version: 80,
    parent: details.details,
    template: () => i18n.feedLinkNewTab,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.feedLinkNewTabDetail },
      author: { type: 'boolean', initial: true },
      mention: { type: 'boolean', initial: true },
      topic: { type: 'boolean', initial: true },
      detail: { type: 'boolean', initial: true },
      comments: { type: 'boolean', initial: true },
    },
    // 实现在 render 里
  });

}());
