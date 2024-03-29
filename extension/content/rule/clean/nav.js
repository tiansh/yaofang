; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const backend = yawf.backend;

  const clean = yawf.rules.clean;

  const i18n = util.i18n;

  Object.assign(i18n, {
    cleanNavGroupTitle: { cn: '隐藏模块 - 导航栏', tw: '隱藏模組 - 導覽列', en: 'Hide Modules - Navigation Bar' },
    cleanNavLogoImg: { cn: '节日徽标', tw: '節日徽標', en: 'Holiday logo' },
    cleanNavMain: { cn: '首页', tw: '首頁', en: 'Home' },
    cleanNavTV: { cn: '视频', en: '视频 (Video)' },
    cleanNavHot: { cn: '热门（发现）', en: 'Discover' },
    cleanNavECom: { cn: '电商', en: '电商 (Mall)' },
    cleanNavGame: { cn: '游戏', tw: '遊戲', en: 'Game' },
    cleanNavHotSearch: { cn: '大家正在搜', tw: '大家正在熱搜', en: 'Hot search' },
    cleanNavAria: { cn: '无障碍', en: '无障碍 (a11y)' },
    cleanNavNoticeNew: { cn: '新消息计数', tw: '新消息計數', en: 'Count for new notice' },
    cleanNavNew: { cn: '提示红点', tw: '提示紅點', en: 'Red dot tips' },
  });

  clean.tagElements('Nav', [
    '.gn_nav_list>li:not([yawf-id])',
    '.gn_set_v2>a:not([yawf-id])',
  ].join(','), {
    'a[nm="home"]': 'home',
    'a[nm="tv"]': 'tv',
    'a[nm="find"]': 'find',
    'a[nm="name"]': 'name',
    'a[nm="game"]': 'game',
    '.ficon_wb_ds': 'mall',
    '.ficon_game': 'game',
  });

  clean.CleanGroup('nav', () => i18n.cleanNavGroupTitle);
  clean.CleanRule('logo_img', () => i18n.cleanNavLogoImg, 1, {
    v7Support: true,
    ainit: function () {
      util.inject(function (rootKey) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        vueSetup.eachComponentVM('weibo-top-nav', function (vm) {
          Object.defineProperty(vm, 'skinData', { get: () => ({}) });
        });
        vueSetup.eachComponentVM('weibo-top-nav-base', function (vm) {
          Object.defineProperty(vm, 'logoUrl', { get: () => null, set: x => { } });
        });
      }, util.inject.rootKey);
    },
  });
  clean.CleanRuleGroup({
    home: clean.CleanRule('main', () => i18n.cleanNavMain, 1, '', { v7Support: true }),
    tv: clean.CleanRule('tv', () => i18n.cleanNavTV, 1, '', { v7Support: true }),
    hot: clean.CleanRule('hot', () => i18n.cleanNavHot, 1, '', { v7Support: true }),
    eCom: clean.CleanRule('eCom', () => i18n.cleanNavECom, 1, '', { v7Support: true }),
    game: clean.CleanRule('game', () => i18n.cleanNavGame, 1, '', { v7Support: true }),
  }, function (options) {
    util.inject(function (rootKey, options) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      vueSetup.eachComponentVM('weibo-top-nav', function (vm) {
        if (Array.isArray(vm.channels)) {
          const filtered = vm.channels.filter(channel => !options[channel.name]);
          vm.channels.splice(0, vm.channels.length, ...filtered);
        }
        let links = vm.links;
        if (!Object.getOwnPropertyDescriptor(vm, 'links')?.get) {
          Object.defineProperty(vm, 'links', {
            get() { return links.filter(link => !options[link.name]); },
            set(v) { links = v; },
          });
        }
      });

    }, util.inject.rootKey, options);
  });
  if (env.config.requestBlockingSupported) {
    clean.CleanRule('hot_search', () => i18n.cleanNavHotSearch, 1, {
      init: function () {
        backend.onRequest('hotSearch', details => {
          if (this.isEnabled()) return { cancel: true };
          return {};
        });
      },
    });
  } else if (function supportMutationEvent() {
    // 用户脚本版无法用 background 脚本拦截网络请求
    // Mutation Event 会在节点插入之前触发，阻止插入就可以阻止脚本运行
    // MutationObserver 会在节点插入之后触发，并不能保证阻止 JSONP 请求成功进行
    // 此外除了 GM3 意外的猴子，用户脚本无法保证 document-start，所以也不能靠拦截 STK 注册来实现这个功能
    // 我们应该也没有几个 GM3 的用户，所以不打算为 GM3 做特殊处理
    // Mutation Event 为待废弃功能，如果某天浏览器停止支持这个功能，这里只能删掉
    const placeholder = document.createElement('div');
    let supported = false;
    placeholder.addEventListener('DOMNodeInserted', () => { supported = true; });
    placeholder.appendChild(document.createElement('span'));
    return supported;
  }()) {
    clean.CleanRule('hot_search', () => i18n.cleanNavHotSearch, 1, {
      ainit: function () {
        document.documentElement.addEventListener('DOMNodeInserted', event => {
          const script = event.target;
          if (script?.tagName?.toLowerCase() !== 'script') return;
          const pattern = /^https?:\/\/s.weibo.com\/ajax\/jsonp\/gettopsug\?(?:.*&)?_cb=(STK_\d+)/;
          const match = script.src.match(pattern);
          if (!match || !match[1]) return;
          const callback = match[1];
          util.inject(function (callback) { delete window[callback]; }, callback);
          event.preventDefault();
          if (script.parentNode) script.parentNode.removeChild(script);
        });
      },
    });
  }
  clean.CleanRule('aria', () => i18n.cleanNavAria, 98, '[yawf-component-tag~="aria"] { display: none !important; }', { v7Support: true });
  clean.CleanRule('notice_new', () => i18n.cleanNavNoticeNew, 1, '.WB_global_nav .gn_set_list .W_new_count { display: none !important; }');
  clean.CleanRule('new', () => i18n.cleanNavNew, 1, '', {
    v7Support: true,
    ainit: function () {
      util.inject(function (rootKey) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        vueSetup.transformComponentsRenderByTagName('ctrls', function (nodeStruct, Nodes) {
          const { vNode } = Nodes;
          const badges = Array.from(nodeStruct.querySelectorAll('x-woo-badge'));
          badges.forEach(budge => {
            Object.assign(vNode(budge).componentOptions.propsData, { dot: false, value: 0 });
          });
        });
      }, util.inject.rootKey);
    },
  });

}());
