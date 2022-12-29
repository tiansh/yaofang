; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const i18n = util.i18n;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanLeftGroupTitle: { cn: '隐藏模块 - 左栏', tw: '隱藏模組 - 左欄', en: 'Hide modules - Left Column' },
    cleanLeftHome: { cn: '全部关注（首页）', tw: '首頁', en: 'Home' },
    cleanLeftFav: { cn: '我的收藏', tw: '我的收藏', en: 'Favorite' },
    cleanLeftLike: { cn: '我的赞', tw: '我的讚', en: 'Like' },
    cleanLeftHot: { cn: '热门微博', tw: '熱門微博', en: 'Hot Feeds' },
    cleanLeftTV: { cn: '热门视频', tw: '熱門視頻', en: 'Hot Video' },
    cleanLeftNewFeed: { cn: '最新微博', tw: '最新微博', en: '最新微博 (Newest Feeds)' },
    cleanLeftFriends: { cn: '好友圈', tw: '好友圈', en: 'Friends' },
    cleanLeftGroupToMe: { cn: '群微博', tw: '群微博', en: '群微博 (Group)' },
    cleanLeftSpecial: { cn: '特别关注', tw: '特别關注', en: 'Special Focus' },
    cleanLeftWhisper: { cn: '悄悄关注', tw: '悄悄關注', en: 'Secret Following' },
    cleanLeftVPlus: { cn: '付费订阅（V+）', tw: '付費訂閱（V+）', en: 'Paid Subscribe (V+)' },
    cleanLeftNew: { cn: '新微博提示红点', tw: '新微博提示紅點', en: 'Red dot for new Feeds' },
    cleanLeftNews: { cn: '新消息计数', tw: '新消息計數', en: 'Counts for News' },
    cleanLeftCount: { cn: '新分组微博计数', tw: '新分組微博計數', en: 'Counts of Feeds by Group' },
  });

  clean.CleanGroup('left', () => i18n.cleanLeftGroupTitle);
  clean.CleanRule('level', () => i18n.cleanIconsLevel, 1, '.icon_bed[node-type="level"], .W_level_ico, .W_icon_level { display: none !important; }');
  const new_feed = clean.CleanRule('new_feed', () => i18n.cleanLeftNewFeed, 21, '', { v7Support: true });
  const friends = clean.CleanRule('friends', () => i18n.cleanLeftFriends, 1, '', { v7Support: true });
  const special = clean.CleanRule('special', () => i18n.cleanLeftSpecial, 1, '', { v7Support: true });

  clean.tagElements('Left', [
    '#v6_pl_leftnav_group .lev:not([yawf-id])',
  ].join(','), {
    'a[href*="krcom.cn"]': 'leftnav_tv',
    'a[href*="is_new=1"]': 'leftnav_new',
    'a[href*="/home?"]': 'leftnav_home',
    'a[href^="/at/"]': 'leftnav_message',
    'a[href^="/fav"]': 'leftnav_fav',
    'a[href^="/like"]': 'leftnav_like',
    'a[href^="/friends"]': 'leftnav_friends',
    'a[href^="/groupsfeed"]': 'leftnav_groupsfeed',
    'a[href*="//d.weibo.com"]': 'leftnav_hot',
    'a[href*="//weibo.com/tv"]': 'leftnav_tv',
    'a[href^="/mygroups"][href*="isspecialgroup=1"]': 'leftnav_special',
    'a[href^="/mygroups"][href*="whisper=1"]': 'leftnav_whisper',
    'a[href^="/mygroups"][href*="vplus=1"]': 'leftnav_vplus',
    'a[href^="/mygroups"]': 'leftnav_mygroups',
  });

  clean.CleanRuleGroup({
    new_feed,
    special,
    friends,
  }, function (options) {
    if (yawf.rules.filter.homepage.newestFeeds.getConfig()) {
      options.new_feed = false;
    }

    util.inject(function (rootKey, options) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      const icons = {
        navNew: 'new_feed',
        navSpecial: 'special',
        navMutual: 'friends',
      };
      vueSetup.eachComponentVM('home', function (vm) {
        vm.$watch(function () { return this.leftTabs; }, function () {
          if (Array.isArray(vm.leftTabs)) {
            const filtered = vm.leftTabs.filter(tab => !options[icons[tab.icon]]);
            if (vm.leftTabs.length !== filtered.length) vm.leftTabs = filtered;
          }
        }, { immediate: true });
      });

    }, util.inject.rootKey, options);
  });

}());
