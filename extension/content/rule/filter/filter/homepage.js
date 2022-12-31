; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const request = yawf.request;
  const browserInfo = yawf.browserInfo;
  const feedParser = yawf.feed;
  const notifications = yawf.notifications;
  const init = yawf.init;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;
  const keyboard = util.keyboard;
  const css = util.css;

  Object.assign(i18n, {
    feedsHomepageGroupTitle: {
      cn: '首页',
      tw: '首頁',
      en: 'Homepage',
    },
    feedsHomepageNewest: {
      cn: '使用最新微博代替首页（首页微博时间顺序排列）（推荐）',
      tw: '使用最新微博代替首頁（首頁微博時間順序排列）（推薦）',
      en: 'Use newest feeds for home page (home page timeline order) (suggested)',
    },
    feedsHomepageSingleGroup: {
      cn: '使用单个分组页代替首页（首页微博时间顺序排列）{{i}}||分组{{group}}',
      tw: '使用單個分組頁代替首頁（首頁微博時間順序排列）{{i}}||分組{{group}}',
      en: 'Use single feed list by group for home page (home page timeline order) {{i}}||Group{{group}}',
    },
    feedsHomepageSingleGroupDetail: {
      cn: '微博的分组页面按时间顺序正常排列。分组人数有限制，非会员至多 200 人/组。如果您的关注较少，建议使用分组代替首页。注意，分组页面中按作者过滤的规则将不会生效，如果您不希望看到某人的微博，您可以将其移出分组。',
    },
    feedsHomepageMultiGroup: {
      cn: '使用多个分组页代替首页（首页微博时间顺序排列）{{i}}||每次展示{{count}}条|点击查看更多时{{more}}||{{unread}}自动检查和提示未读微博{{ii}}||分组{{groups}}',
      tw: '使用多個分組頁代替首頁（首頁微博時間順序排列）{{i}}||每次展示{{count}}條|點擊查看更多時{{more}}||{{unread}}自動檢查和提示未讀微博{{ii}}||分組{{groups}}',
      en: 'Use multiple feed lists by group for home page (home page timeline order) {{i}}||show {{count}} feeds per page|{{more}} before show next page||{{unread}} Show tips for unread feeds {{ii}}||Groups{{groups}}',
    },
    feedsHomepageMultiGroupDetail: {
      cn: '微博的分组页面按时间顺序排列，如果您的关注较少，建议您将他们放入一个分组后启用使用“单个”分组的选项。如果您关注的人数较多，您可以选择多个分组，分组过多可能造成更长的加载时间，以及加载时的卡顿，建议尽量减少选择的分组数量。',
    },
    feedsHomepageMultiGroupDetail2: {
      cn: '检查未读微博仅对一般的分组有效，对悄悄关注分组无效。',
    },
    feedsHomepageKeepOld: {
      cn: '保留已展示微博',
      en: 'keep shown feeds',
    },
    feedsHomepageCleanOld: {
      cn: '清空已展示微博',
      en: 'clean up shown feeds',
    },
    feedsHomePageDoneGroup: {
      cn: '分组 {1} 的最近微博已全部展示',
      tw: '分組 {1} 的最近微博已全部展示',
      en: 'All recent feeds from group {1} had been shown',
    },
    feedsMultiGroupLoading: {
      cn: '正在加载……',
      tw: '正在載入……',
      en: 'Loading ...',
    },
    feedsMultiGroupLoadMore: {
      cn: '查看更多微博',
      en: 'Show more feeds',
    },
    feedsUnreadTipWithCount: {
      cn: '有 {1} 条新微博，点击查看',
      tw: '有 {1} 條新微博，點擊查看',
      en: '{1} new feeds',
    },
    feedsUnreadTip: {
      cn: '有新微博，点击查看',
      tw: '有新微博，點擊查看',
      en: 'show new feeds',
    },
    feedsUnreadLoading: {
      cn: '正在加载……',
      tw: '正在載入……',
      en: 'Loading ...',
    },
  });

  const homepage = filter.homepage = {};
  homepage.homepage = rule.Group({
    parent: filter.filter,
    template: () => i18n.feedsHomepageGroupTitle,
  });

  const fixHomeUrl = function (config) {
    util.inject(function (rootKey, { gid, name, api, index, source }) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      const root = vueSetup.getRootVm();
      const router = root.$router;
      router.beforeEach((to, from, next) => {
        if (to.name === 'home') {
          next('/mygroups?gid=' + gid);
        } else {
          next();
        }
      });
      if (router.currentRoute.name === 'home') {
        router.replace('/mygroups?gid=' + gid);
      }

      const bus = root.$Bus;
      bus.$on('handleHomeNav', function (data) {
        if (data.gid.startsWith('10001')) {
          bus.$emit('handleHomeNav', { gid, title: name, api, yawf_Trigger: true }, index, source);
        } else if (data.yawf_Trigger) {
          vueSetup.eachComponentVM('home', function (vm) {
            if (vm.getCurIndex) vm.getCurIndex(); // 别信他叫 get，要调他来更新当前高亮元素
          }, { watch: false });
        }
      });
    }, util.inject.rootKey, config);
  };

  homepage.newestFeeds = rule.Rule({
    v7Support: true,
    id: 'filter_homepage_newest_feeds',
    version: 21,
    parent: homepage.homepage,
    template: () => i18n.feedsHomepageNewest,
    init() {
      this.addConfigListener(config => {
        if (config) {
          homepage.singleGroup.setConfig(false);
          homepage.multiGroup.setConfig(false);
        }
      });
    },
    ainit() {
      const uid = init.page.config.user.idstr;
      fixHomeUrl({
        gid: '11000' + uid,
        api: '/ajax/feed/friendstimeline',
        name: '最新微博',
        index: 1,
        source: 'left',
      });
    },
  });

  let groupListLazyPromiseResolve;
  const groupListLazyPromise = new Promise(resolve => {
    groupListLazyPromiseResolve = resolve;
  }).then(async () => {
    const groups = await request.groupList();
    return groups.map(({ gid, title }) => ({ text: title, value: gid }));
  });
  homepage.singleGroup = rule.Rule({
    v7Support: true,
    id: 'filter_homepage_single_group',
    version: 1,
    parent: homepage.homepage,
    template: () => i18n.feedsHomepageSingleGroup,
    ref: {
      group: {
        type: 'select',
        select: groupListLazyPromise,
        afterRender: function (container) {
          groupListLazyPromiseResolve();
          return container;
        },
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.feedsHomepageSingleGroupDetail },
    },
    init() {
      this.addConfigListener(config => {
        if (config) {
          homepage.newestFeeds.setConfig(false);
          homepage.multiGroup.setConfig(false);
        }
      });
    },
    async ainit() {
      const gid = this.ref.group.getConfig();
      const groups = await request.groupList();
      const index = groups.findIndex(g => g.gid === gid);
      const name = groups[index].title;
      const api = '/ajax/feed/groupstimeline';
      fixHomeUrl({ gid, api, name, index, source: 'custom' });
    },
  });

  Object.assign(i18n, {
    feedsAutoLoad: { cn: '自动载入新微博{{i}}', tw: '自動載入新微博{{i}}', en: 'Load new feeds automatically {{i}}' },
    feedsAutoLoadDetail: {
      cn: '启用该选项可以在显示“有新微博”的提示横幅出现前过滤微博，避免点开提示，但是并没有刷出来微博的情况；因为扩展会读取对应微博以便过滤，这些微博会被标记为“已读”，因此勾选此项会导致在其他设备上收不到有新微博提示。',
    },
    feedsAutoShow: {
      cn: '加载后自动展示|{{background}}页面活动时暂停',
      tw: '載入後自動展示|{{background}}頁面活躍時暫停',
      en: 'Show feeds after automatically loaded| {{background}} pause when page active',
    },
    feedsDesktopNotify: {
      cn: '自动载入后显示桌面提示||{{whitelist}}仅对命中总是显示规则的微博生效',
      tw: '自動載入後显示桌面提示||{{whitelist}}僅對命中總是顯示規則的微博生效',
      en: 'Show desktop notification after automatically loaded||{{whitelist}} only apply to feeds hit always show rules',
    },
  });

  const showUnreadFeeds = function () {
    let newfeedtip = document.getElementById('yawf-new-feed-tip');
    if (!newfeedtip) return;
    newfeedtip.remove();
    const unreadFeeds = Array.from(document.querySelectorAll('[yawf-feed-preload="unread"]'));
    unreadFeeds.forEach(feed => {
      feed.setAttribute('yawf-feed-preload', 'show');
    });
  };

  homepage.autoLoad = rule.Rule({
    id: 'filter_homepage_auto_load',
    version: 1,
    parent: homepage.homepage,
    template: () => i18n.feedsAutoLoad,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.feedsAutoLoadDetail },
    },
    ainit() {

      // 完成过滤后再提示有未读消息
      observer.feed.onFinally(function countUnreadFeeds() {
        const unreadFeeds = Array.from(document.querySelectorAll('[yawf-feed-preload="unread"]'));
        const status = unreadFeeds.length;
        let newfeedtip = document.getElementById('yawf-new-feed-tip');
        if (status === 0 && newfeedtip) {
          newfeedtip.remove();
        } else if (status !== 0) {
          if (!newfeedtip) {
            const container = document.createElement('div');
            container.innerHTML = '<div class="WB_cardwrap WB_notes" id="yawf-new-feed-tip"><a href="javascript:void(0);"></a></div>';
            newfeedtip = container.firstChild;
            const feedlist = document.querySelector('.WB_feed');
            feedlist.parentNode.insertBefore(newfeedtip, feedlist);
            newfeedtip.querySelector('a').addEventListener('click', showUnreadFeeds);
          }
          const link = newfeedtip.querySelector('a');
          if (status > 0 && status < 100) {
            link.textContent = i18n.feedsUnreadTipWithCount.replace('{1}', status);
          } else {
            link.textContent = i18n.feedsUnreadTip;
          }
        }
      });

      // 响应键盘操作
      document.addEventListener('keyup', function loadPreloadedContentKey(event) {
        if (keyboard.event(event) !== keyboard.code.PERIOD) return;
        showUnreadFeeds();
      });

      // 隐藏预加载的内容
      css.append(`
#v6_pl_content_homefeed [yawf-feed-preload="unread"] { display: none !important; }
#home_new_feed_tip { display: none !important; }
.WB_feed [node-type="yawf-feed_list_timeTip"], .WB_feed [node-type="feed_list_timeTip"] { display: none !important; }
.WB_feed a.notes[action-type="feed_list_newBar"][node-type="feed_list_newBar"] { display: none !important; }
.WB_feed div.W_loading[requesttype="newFeed"] { display: none !important; }
.WB_feed .WB_notes[requesttype="newFeed"] { display: none !important; }
.WB_feed [node-type="lazyload"]:not(:last-child) { display: none !important; }
`);

      // 检查有新内容载入，并隐藏它们
      observer.feed.onBefore(function hideAutoLoadFeeds(feed) {
        if (feed.hasAttribute('yawf-feed-preload')) return;
        let isUnread = true;
        // 如果一天一条微博出现在了现有的微博的后面，那么可能是因为动态加载塞进来的
        if (feed.matches('.WB_feed_type[yawf-feed-preload="show"] ~ *')) isUnread = false;
        // 但是在后面不一定是现在的微博的弟弟妹妹，还可能是弟弟妹妹的孩子
        // 这是因为他们在出现时会有一个出现的动画，为了做这个动画把他们套在一个父对象里面了
        // 动画播放完成之后会被拿出来的（不过说实话，这动画一般人注意不到）
        if (feed.matches('.WB_feed_type[yawf-feed-preload="show"] ~ * *')) isUnread = false;
        // 最早出现的几条不算延迟加载的
        if (document.querySelectorAll('.WB_feed_type[yawf-feed-preload]').length < 5) isUnread = false;
        // 如果作者是自己那么不算延迟加载的（发微薄的时候会插入到最前面）
        const [author] = feedParser.author.id(feed);
        const [fauthor] = feedParser.fauthor.id(feed);
        if (init.page.config.user.idstr === (fauthor || author)) isUnread = false;
        feed.setAttribute('yawf-feed-preload', isUnread ? 'unread' : 'show');
      });

      // 自动载入新内容
      observer.dom.add(function watchNewFeedTip() {
        const tip = document.querySelector('#home_new_feed_tip');
        if (!tip) return;
        // 如果不在第一页或者有特殊的过滤条件那么没法自动载入
        const search = new URLSearchParams(location.search);
        const cannotLoad = search.get('page') > 1 || ['is_ori', 'is_pic', 'is_video', 'is_music', 'is_search'].some(key => search.get(key));
        if (cannotLoad) return;
        // 微博自己把提示的状态和数量写在了提示横幅那个对象上
        const $tip = tip && browserInfo.name === 'Firefox' && tip.wrappedJSObject || tip;
        // status 不是 followHot 而且 count > 0 就说明有新消息
        if (!$tip || $tip.status === 'followHot') return;
        if (!$tip.count) return;
        // 如果超过 50 条他会自动重新加载，我们骗他一下
        if ($tip.count > 50) $tip.count = 50;
        tip.click();
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      });

    },
  });

  homepage.desktopNotify = rule.Rule({
    id: 'filter_homepage_desktop_notify',
    version: 1,
    parent: homepage.homepage,
    template: () => i18n.feedsDesktopNotify,
    ref: { whitelist: { type: 'boolean' } },
    ainit() {
      const whitelist = this.ref.whitelist.getConfig();

      // 完成过滤后再提示有未读消息
      observer.feed.onFinally(function countUnreadFeeds() {
        const unreadFeeds = Array.from(document.querySelectorAll('[yawf-feed-preload="unread"]:not([yawf-feed-notify])'));
        unreadFeeds.forEach(async feed => {
          feed.setAttribute('yawf-feed-notify', '');
          if (whitelist && feed.getAttribute('yawf-feed-display') !== 'show') return;
          const text = feedParser.text.simple(feed);
          const [author] = feedParser.author.name(feed);
          const avatar = feedParser.author.avatar(feed);
          if (!text || !author || !avatar) return;
          const truncked = text.length > 300 ? text.slice(0, 250) + '……' : text;
          const userResponse = await notifications.show({
            title: author,
            content: truncked,
            icon: avatar,
            duration: 5000 + 15 * truncked.length,
          });
          if (!userResponse) return;
          showUnreadFeeds();
          setTimeout(() => {
            document.documentElement.scrollTop += feed.getClientRects()[0].top - 80;
            const evt = document.createEvent('KeyboardEvent');
            evt.initKeyEvent('keydown', true, true, null, false, false, false, false, util.keyboard.code.J, 0);
            document.documentElement.dispatchEvent(evt);
            // 聊天窗口（打开将聊天窗口内嵌的功能后）展开的时候很影响微博阅读
            // 所以这里送一个 click 可以把聊天窗口收起来
            feed.click();
          }, 0);
        });
      });

    },
  });

}());
