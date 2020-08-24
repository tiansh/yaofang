; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const observer = yawf.observer;
  const init = yawf.init;

  const i18n = util.i18n;
  const css = util.css;
  const priority = util.priority;

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

  const leftHide = (function () {
    const ids = [];
    // 移除一个左栏链接或相关元素
    const removeNode = function removeNode(node) {
      const container = node.parentNode;
      let prev, next;
      const removeBlank = function (node) {
        if (node && node.nodeType === Node.TEXT_NODE && node.data.match(/^\s*$/)) {
          return container.removeChild(node);
        }
        if (node && node.nodeType === Node.COMMENT_NODE) {
          return container.removeChild(node);
        }
        return null;
      };
      const removeBlankSibling = function (node) {
        while (removeBlank(node.previousSibling));
        while (removeBlank(node.nextSibling));
      };
      removeBlankSibling(node);
      prev = node.previousSibling; next = node.nextSibling;
      // 如果前后都是分割线（连续的分割线）那么应当删掉一个（删掉前面一个）
      // 如果分割线在开头或末尾，那么应该删掉分割线
      // 如果前后都没有东西，那么应该连同容器一起删除
      while ((!prev || prev.matches('.lev_line')) &&
        (!next || next.matches('.lev_line'))) {
        let line = null;
        if (prev && prev.matches('.lev_line')) line = prev;
        if (next && next.matches('.lev_line')) line = next;
        if (line) {
          line = prev || next;
          removeBlankSibling(line);
          container.removeChild(line);
          prev = node.previousSibling;
          next = node.nextSibling;
        } else break;
      }
      if (node.parentNode) node.parentNode.removeChild(node);
      if (!prev && !next) removeNode(container);
    };
    // 检查是否有未筛选的左栏链接并根据名称判断
    const listener = function leftNavRemove() {
      const levs = Array.from(document.querySelectorAll('#v6_pl_leftnav_group .lev[yawf-id]:not([yawf-checked-lev])'));
      levs.forEach(function (lev) {
        const id = lev.getAttribute('yawf-id');
        if (ids.includes(id)) removeNode(lev);
        else lev.setAttribute('yawf-checked-lev', '');
      });
    };
    css.append('#v6_pl_leftnav_group .lev:not([yawf-checked-lev]) { visibility: hidden; }');
    init.onLoad(function () {
      if (yawf.WEIBO_VERSION !== 6) return;
      observer.dom.add(listener);
      listener();
    }, { priority: priority.LAST });
    return function (id) {
      return () => { ids.push('leftnav_' + id); };
    };
  }());

  clean.CleanGroup('left', () => i18n.cleanLeftGroupTitle);
  clean.CleanRule('level', () => i18n.cleanIconsLevel, 1, '.icon_bed[node-type="level"], .W_level_ico, .W_icon_level { display: none !important; }');
  clean.CleanRule('home', () => i18n.cleanLeftHome, 1, leftHide('home'));
  clean.CleanRule('fav', () => i18n.cleanLeftFav, 1, leftHide('fav'));
  clean.CleanRule('like', () => i18n.cleanLeftLike, 1, leftHide('like'));
  clean.CleanRule('hot', () => i18n.cleanLeftHot, 1, leftHide('hot'));
  clean.CleanRule('tv', () => i18n.cleanLeftTV, 1, leftHide('tv'));
  const new_feed = clean.CleanRule('new_feed', () => i18n.cleanLeftNewFeed, 21, leftHide('new'), { weiboVersion: [6, 7] });
  const friends = clean.CleanRule('friends', () => i18n.cleanLeftFriends, 1, leftHide('friends'), { weiboVersion: [6, 7] });
  clean.CleanRule('group_to_me', () => i18n.cleanLeftGroupToMe, 1, leftHide('groupsfeed'));
  const special = clean.CleanRule('special', () => i18n.cleanLeftSpecial, 1, leftHide('special'), { weiboVersion: [6, 7] });
  clean.CleanRule('whisper', () => i18n.cleanLeftWhisper, 1, leftHide('whisper'));
  clean.CleanRule('v_plus', () => i18n.cleanLeftVPlus, 1, leftHide('vplus'));
  clean.CleanRule('new', () => i18n.cleanLeftNew, 1, '.WB_left_nav .lev .W_new, .yawf-WB_left_nav .lev .W_new { display: none !important; }');
  clean.CleanRule('news', () => i18n.cleanLeftNews, 1, '.WB_left_nav .level_1_Box .W_new_count, .yawf-WB_left_nav .level_1_Box .W_new_count { display: none !important; }');
  clean.CleanRule('count', () => i18n.cleanLeftCount, 1, '.WB_left_nav .pl_leftnav_group .W_new_count, .WB_left_nav .lev .W_new_count, .yawf-WB_left_nav .pl_leftnav_group .W_new_count, .yawf-WB_left_nav .lev .W_new_count { display: none !important; }');

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
    if (yawf.WEIBO_VERSION !== 7) return;
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
