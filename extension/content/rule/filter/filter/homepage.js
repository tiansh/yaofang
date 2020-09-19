; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const request = yawf.request;
  const browserInfo = yawf.browserInfo;
  const stk = yawf.stk;
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

  // 因为 YAWF 脚本用的 -1，这里为了避免可能的冲突（虽然别的功能还是会冲突），所以用 -2
  const CUSTOM_GID = -2;

  const fixHomeUrlV6 = function (target) {
    const setParam = function (url) {
      if (target === 'newest') {
        url.searchParams.delete('gid');
        url.searchParams.set('is_new', 1);
      } else if (target === 'custom') {
        url.searchParams.set('gid', CUSTOM_GID);
      } else if (target.startsWith('g')) {
        url.searchParams.set('gid', target.slice(1));
      } else if (target === 'whisper') {
        url.searchParams.delete('gid');
        url.searchParams.set('whisper', 1);
      }
    };
    const updateLocation = function updateLocation() {
      const isHomeFeed = document.getElementById('v6_pl_content_homefeed');
      const notHomeFeed = document.getElementById('v6_pl_content_commentlist') ||
        document.querySelector('[id^="Pl_Official_MyProfileFeed__"]');
      if (!isHomeFeed && !notHomeFeed) return;
      const url = new URL(location.href);
      const hasGid = Boolean(+url.searchParams.get('gid'));
      const isNew = Boolean(+url.searchParams.get('is_new'));
      const isSearch = Boolean(+url.searchParams.get('is_search'));
      const isSpecial = ['isfriends', 'vplus', 'isfriends', 'isgroupsfeed', 'whisper']
        .some(key => +url.searchParams.get(key));
      const isCustomGid = hasGid && url.searchParams.get('gid') < 0;
      const shouldBeFixed = isHomeFeed && !isSearch && !isSpecial;
      const shouldRemoveGid = notHomeFeed && isCustomGid;
      const incorrectGid = isCustomGid && target !== 'custom';
      if ((!hasGid || incorrectGid) && !isNew && shouldBeFixed) {
        setParam(url);
        observer.dom.remove(updateLocation);
        location.replace(url.href);
      } else if (hasGid && shouldRemoveGid) {
        url.searchParams.delete('gid');
        observer.dom.remove(updateLocation);
        location.replace(url);
      }
    };
    observer.dom.add(updateLocation);

    const updateHomeLinks = function updateHomeLinks() {
      /** @type {HTMLAnchorElement[]} */
      const links = Array.from(document.querySelectorAll([
        '.gn_logo a', // 导航栏logo
        'a[suda-uatrack*="homepage"]', // 首页链接，根据跟踪标识识别；适用于顶栏和左栏
        '#v6_pl_content_homefeed a[action-type="search_type"][action-data="type=0"]', // 首页消息流顶部的“全部”链接
      ].map(selector => selector + ':not([href*="is_search"])').join(',')));
      links.forEach(link => {
        const url = new URL(link.href);
        setParam(url);
        link.href = url.href;
      });
    };
    observer.dom.add(updateHomeLinks);
  };

  const fixHomeUrlV7 = function (config) {
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
    weiboVersion: [6, 7],
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
      if (yawf.WEIBO_VERSION === 6) {
        fixHomeUrlV6('newest');
      } else {
        const uid = init.page.config.user.idstr;
        fixHomeUrlV7({
          gid: '11000' + uid,
          api: '/ajax/feed/friendstimeline',
          name: '最新微博',
          index: 1,
          source: 'left',
        });
      }
    },
  });

  let groupListLazyPromiseResolve;
  const groupListLazyPromise = new Promise(resolve => {
    groupListLazyPromiseResolve = resolve;
  }).then(async () => {
    if (yawf.WEIBO_VERSION === 6) {
      const groups = await request.groupList();
      return groups.map(({ name, id }) => ({ text: name, value: id }));
    } else {
      const groups = await request.groupListV7();
      return groups.map(({ gid, title }) => ({ text: title, value: gid }));
    }
  });
  homepage.singleGroup = rule.Rule({
    weiboVersion: [6, 7],
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
      if (yawf.WEIBO_VERSION === 6) {
        let group = this.ref.group.getConfig();
        if (group == null) {
          await groupListLazyPromise;
          group = this.ref.group.getConfig();
        }
        fixHomeUrlV6(group);
      } else {
        const gid = this.ref.group.getConfig();
        const groups = await request.groupListV7();
        const index = groups.findIndex(g => g.gid === gid);
        const name = groups[index].title;
        const api = '/ajax/feed/groupstimeline';
        fixHomeUrlV7({ gid, api, name, index, source: 'custom' });
      }
    },
  });

  homepage.multiGroup = rule.Rule({
    id: 'filter_homepage_multi_group',
    version: 1,
    parent: homepage.homepage,
    template: () => i18n.feedsHomepageMultiGroup,
    ref: {
      count: {
        type: 'range',
        min: 20,
        max: 200,
        initial: 50,
        step: 10,
      },
      more: {
        type: 'select',
        select: [
          { value: 'keep', text: () => i18n.feedsHomepageKeepOld },
          { value: 'clear', text: () => i18n.feedsHomepageCleanOld },
        ],
        initial: 'clear',
      },
      unread: {
        type: 'boolean',
      },
      groups: {
        type: 'groups', // 不支持 V7
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.feedsHomepageMultiGroupDetail },
      ii: { type: 'bubble', icon: 'warn', template: () => i18n.feedsHomepageMultiGroupDetail2 },
    },
    init() {
      this.addConfigListener(config => {
        if (config) {
          homepage.newestFeeds.setConfig(false);
          homepage.singleGroup.setConfig(false);
        }
      });
    },
    ainit() {
      const rule = this;
      const count = rule.ref.count.getConfig();
      const unread = rule.ref.unread.getConfig();
      const groups = rule.ref.groups.getConfig().slice(0);
      const clear = rule.ref.more.getConfig() === 'clear';
      const autoLoad = homepage.autoLoad.isEnabled();

      if (groups.length === 0) return;

      fixHomeUrlV6('custom');

      // 检查当前页面是否需要启用分组拼凑首页功能
      const checkPage = function checkMultiGroupPage() {
        const query = new URLSearchParams(location.search);
        const gid = +query.get('gid');
        if (gid !== CUSTOM_GID) return;
        if (!Array.isArray(groups)) return;
        if (groups.length < 2) return;
        query.delete('gid');
        observer.dom.add(function multiGroupPageFix() {
          watchFeedList(query);
          watchMembers();
        });
      };

      const getLoadingTip = function () {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2"><div class="WB_empty WB_empty_narrow"><div class="WB_innerwrap"><div class="empty_con clearfix"><p class="text"><i class="W_loading"></i></p></div></div></div></div>';
        container.querySelector('.text').appendChild(document.createTextNode(i18n.feedsMultiGroupLoading));
        return container.firstChild;
      };
      const getShowMore = function () {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2 yawf-multiGroupMore"><a class="WB_cardmore WB_cardmore_noborder clearfix" href="javascript:;"><span class="more_txt W_f14"><em class="W_ficon ficon_arrow_down">c</em></span></a></div>';
        const textContainer = container.querySelector('span');
        textContainer.insertBefore(document.createTextNode(i18n.feedsMultiGroupLoadMore), textContainer.firstChild);
        return container.firstChild;
      };

      // 找到消息流的容器，并初始化好它
      const watchFeedList = function (query) {
        const placeholder = document.querySelector('.WB_feed > .WB_result_null');
        if (!placeholder) return;
        let feedlist = placeholder.parentElement;
        feedlist.removeChild(placeholder);
        fillFeedList(feedlist, query);
      };

      // 初始化消息流容器
      const fillFeedList = function (feedlist, query) {
        feedlist.classList.add('WB_feed_v3', 'WB_feed_v4');
        const loading = getLoadingTip();
        feedlist.appendChild(loading);
        const showmore = getShowMore();
        showmore.style.display = 'none';
        feedlist.appendChild(showmore);

        const getter = showFeeds(groups, query, { feedlist, loading, showmore });
        if (unread) {
          initUnread(groups, query, getter, { feedlist });
        }
      };

      // 下掉边栏组内用户的组件
      const watchMembers = function () {
        const members = document.getElementById('v6_pl_rightmod_groups');
        if (members) members.parentNode.removeChild(members);
      };

      // 初始化拼凑首页的逻辑
      const showFeeds = function (groups, query, dom) {
        const getter = request.feedsByGroups(groups, query);
        showMoreFeeds(getter, count, dom);
        return getter;
      };

      // 一条一条往消息流里面塞内容
      const showMoreFeeds = async function (getter, remain, dom) {
        const hasNext = await getter.hasNext();
        if (!hasNext) {
          everythingDone(dom);
          return;
        }
        if (remain === 0) {
          await waitShowMore(dom);
          remain = count;
        }
        const feed = await getter.next();
        if (feed.type === 'feed') {
          renderFeed(feed.dom, dom);
          await new Promise(resolve => setTimeout(resolve, 10));
          remain--;
        } else {
          renderDone(feed.group, dom);
        }
        showMoreFeeds(getter, remain, dom);
      };

      // 完成一组显示后等用户的操作再继续
      const waitShowMore = async function ({ feedlist, loading, showmore }) {
        loading.style.display = 'none';
        showmore.style.display = 'block';
        await new Promise(resolve => {
          const listener = () => {
            showmore.removeEventListener('click', listener);
            resolve();
          };
          showmore.addEventListener('click', listener);
        });
        loading.style.display = 'block';
        showmore.style.display = 'none';
        if (clear) {
          const nav = document.querySelector('.WB_global_nav');
          const navBottom = nav.clientTop + nav.clientHeight;
          const feedlistTop = feedlist.parentNode.offsetTop;
          const margin = 10;
          document.documentElement.scrollTop = feedlistTop - (navBottom + margin);
          while (feedlist.firstChild !== loading) {
            feedlist.removeChild(feedlist.firstChild);
          }
        }
      };

      // 显示一条消息
      const renderFeed = function (feed, { feedlist, loading }) {
        feedlist.insertBefore(feed, loading);
      };

      // 完成一个分组的加载
      const renderDone = function (group, { feedlist, loading }) {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2 yawf-multiGroupDone"><div class="WB_cardtitle_a W_tc yawf-multiGroupDoneTitle"></div></div>';
        const titleContainer = container.querySelector('.yawf-multiGroupDoneTitle');
        const [textBefore, textAfter] = i18n.feedsHomePageDoneGroup.split('{1}');
        titleContainer.appendChild(document.createTextNode(textBefore));
        const groupNameContainer = titleContainer.appendChild(document.createElement('span'));
        titleContainer.appendChild(document.createTextNode(textAfter));
        request.groupList().then(groupList => {
          const gotGroup = groupList.find(({ id }) => id === group.id);
          if (gotGroup) groupNameContainer.textContent = gotGroup.name;
        });
        feedlist.insertBefore(container, loading);
      };

      // 所有分组都完成加载
      const everythingDone = function ({ feedlist, loading, showmore }) {
        feedlist.removeChild(loading);
        feedlist.removeChild(showmore);
      };

      const showUnreadFeeds = async function (groups, query, getter, unreadChecker, { newfeedtip, feedlist }, status) {
        unreadChecker.pause();
        if (status > count && !autoLoad) {
          // 未读消息太多了，我们直接刷新算了
          feedlist.innerHTML = '';
          newfeedtip.remove();
          fillFeedList(feedlist, query);
        } else {
          if (!autoLoad) {
            const link = newfeedtip.querySelector('a');
            link.textContent = i18n.feedsUnreadLoading;
            const loading = document.createElement('i');
            loading.className = 'W_loading';
            link.insertBefore(loading, link.firstChild);
            feedlist.insertBefore(newfeedtip, feedlist.firstChild);
          }
          const fragement = document.createDocumentFragment();
          const newGetter = request.feedsByGroups(groups, query);
          for (let limit = count; limit; limit--) {
            const feed = await newGetter.next();
            if (feed.type !== 'feed') continue;
            if (getter.isShown(feed)) break;
            const feedDom = fragement.appendChild(feed.dom);
            if (autoLoad) {
              feedDom.setAttribute('yawf-feed-preload', 'unread');
            }
            getter.addShown(feed);
          }
          feedlist.insertBefore(fragement, feedlist.firstChild);
          if (!autoLoad) {
            newfeedtip.remove();
          }
          unreadChecker.run();
        }
      };

      // 显示新消息提示横幅
      const noticeUnread = function (data, groups, query, getter, { feedlist }, unreadChecker) {
        const status = data.status;
        if (!status) {
          const newfeedtip = document.getElementById('yawf-group-new-feed-tip');
          if (newfeedtip) newfeedtip.remove();
        } else if (autoLoad) {
          showUnreadFeeds(groups, query, getter, unreadChecker, { newfeedtip: null, feedlist }, status);
        } else {
          if (!document.getElementById('yawf-group-new-feed-tip')) {
            const container = document.createElement('div');
            container.innerHTML = '<div class="WB_cardwrap WB_notes" id="yawf-group-new-feed-tip"><a href="javascript:void(0);"></a></div>';
            const newfeedtip = container.firstChild;
            feedlist.parentNode.insertBefore(newfeedtip, feedlist);
            const clickToShowUnreadFeeds = () => {
              showUnreadFeeds(groups, query, getter, unreadChecker, { newfeedtip, feedlist }, newfeedtip.dataset.status);
            };
            newfeedtip.querySelector('a').addEventListener('click', clickToShowUnreadFeeds);
            document.addEventListener('keyup', function loadContentKey(event) {
              if (keyboard.event(event) !== keyboard.code.PERIOD) return;
              document.removeEventListener('keyup', loadContentKey);
              clickToShowUnreadFeeds();
            });
          }
          const newfeedtip = document.getElementById('yawf-group-new-feed-tip');
          if (Number(newfeedtip.dataset.status) !== status) {
            newfeedtip.dataset.status = status;
            newfeedtip.querySelector('a').textContent = i18n.feedsUnreadTipWithCount.replace('{1}', status);
          }
        }
      };

      // 初始化未读提示
      const initUnread = async function (groups, query, getter, { feedlist }) {
        if (!env.config.stkInfoSupported) return;
        const searchParams = ['is_ori', 'is_forward', 'is_text', 'is_pic', 'is_video', 'is_music', 'is_article', 'key_word', 'start_time', 'end_time', 'is_search', 'is_searchadv'];
        // 不支持搜索页面
        if (searchParams.some(param => query.has(param))) return;
        const stkInfo = await stk.info;
        const unreadChecker = request.unreadByGroups(groups, stkInfo);
        const callback = data => {
          noticeUnread(data, groups, query, getter, { feedlist }, unreadChecker);
        };
        unreadChecker.watch(callback);
        observer.dom.add(function waitFeedListRemoved() {
          if (document.contains(feedlist)) return;
          unreadChecker.unwatch(callback);
          observer.dom.remove(waitFeedListRemoved);
        });
      };

      checkPage();

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
        if (init.page.$CONFIG.uid === (fauthor || author)) isUnread = false;
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
