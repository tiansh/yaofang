; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;

  const navbar = layout.navbar = {};

  i18n.navbarToolGroupTitle = {
    cn: '导航栏',
    tw: '導覽列',
    en: 'Navbar',
  };

  navbar.navbar = rule.Group({
    parent: layout.layout,
    template: () => i18n.navbarToolGroupTitle,
  });

  i18n.navbarAutoHide = {
    cn: '自动隐藏导航栏',
    tw: '自動隱藏導覽列',
    en: 'Navbar hide automatically',
  };

  navbar.autoHide = rule.Rule({
    id: 'layout_nav_auto_hide',
    version: 1,
    parent: navbar.navbar,
    template: () => i18n.navbarAutoHide,
    ainit() {
      const attr = 'yawf-navbar-autohide';
      const updateNavFloat = function () {
        const navs = document.querySelectorAll('.WB_global_nav');
        if (!navs.length) return;
        // 你能相信吗？导航栏不一定有一个。很神奇的呢
        const y = window.scrollY;
        Array.from(navs).forEach(function (nav) {
          const f = nav.hasAttribute(attr), r = 42;
          if (y < r && f) nav.removeAttribute(attr);
          if (y >= r && !f) nav.setAttribute(attr, '');
        });
      };
      document.addEventListener('scroll', updateNavFloat);
      updateNavFloat();
      css.append(`
.WB_global_nav:not([${attr}]), .WB_global_nav[${attr}] { margin-top: -50px; top: 50px; box-shadow: none; }
.WB_global_nav[${attr}] { top: 0; transition: top ease-in-out 0.1s 0.33s; }
.WB_global_nav[${attr}]:hover { top: 50px; transition: top ease-in-out 0.1s 0s; }
.WB_global_nav[${attr}]:focus-within { top: 50px; transition: top ease-in-out 0.1s 0s; }
.WB_global_nav[${attr}]::after { content: " "; width: 100%; height: 8px; clear: both; float: left; background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 75%, transparent 100%); }
/* 固定小黄签位置 */
.WB_global_nav[${attr}] .gn_topmenulist_tips { padding-top: 52px; transition: padding-top ease-in-out 0.1s 0.33s; }
.WB_global_nav[${attr}]:hover .gn_topmenulist_tips { padding-top: 2px; transition: padding-top ease-in-out 0.1s 0s; }
.WB_global_nav[${attr}] .gn_topmenulist_tips .ficon_close { top: 56px; transition: top ease-in-out 0.1s 0.33s; }
.WB_global_nav[${attr}]:hover .gn_topmenulist_tips .ficon_close { top: 6px; transition: top ease-in-out 0.1s 0s; }
/* 浮动元素 */
.W_fixed_top { top: 10px !important; }
`);
    },
  });

  Object.assign(i18n, {
    reorderNavbar: {
      cn: '恢复旧式导航栏排列 {{i}}',
      hk: '恢復旧式导览列排列 {{i}}',
      en: 'Restore old navbar layout {{i}}',
    },
    reorderNavbarDetail: {
      cn: '微博字样紧贴在标识右侧显示，“首页”“热门”“游戏”的链接出现在搜索框的左侧。',
    },
  });

  navbar.oldLayout = rule.Rule({
    id: 'layout_nav_classical',
    version: 1,
    parent: navbar.navbar,
    template: () => i18n.reorderNavbar,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.reorderNavbarDetail },
    },
    ainit() {
      const moveNavList = function moveNavList() {
        const search = document.querySelector('.WB_global_nav .gn_search, .WB_global_nav .gn_search_v2');
        const list = document.querySelector('.WB_global_nav .gn_header .gn_position .gn_nav .gn_nav_list');
        if (!search || !list) return;
        const items = Array.from(list.querySelectorAll('li')).slice(0, -1);
        const gnlistWrap = document.createElement('div');
        gnlistWrap.innerHTML = '<div class="gn_nav"><ul class="gn_nav_list"></ul></div>';
        const nlist = gnlistWrap.querySelector('ul');
        items.forEach(function (l) { nlist.appendChild(l); });
        search.parentNode.insertBefore(gnlistWrap.firstChild, search);
        search.parentNode.appendChild(search);
        css.append(`
.WB_global_nav.WB_global_nav .gn_search,
.WB_global_nav.WB_global_nav .gn_search_v2 { float: right; }
.WB_global_nav.WB_global_nav .gn_header { text-align: right; }
.WB_global_nav.WB_global_nav .gn_header > * { text-align: left; }
.WB_global_nav.WB_global_nav .gn_header > .gn_nav { margin-right: 0; }
.WB_global_nav_us.WB_global_nav_us .gn_header { background-image: none; }
.WB_global_nav_us.WB_global_nav_us .gn_logo,
.WB_global_nav_us.WB_global_nav_us .gn_logo .box,
.WB_global_nav.WB_global_nav .gn_logo,
.WB_global_nav.WB_global_nav .gn_logo a { width: 140px !important; left: 0 !important; }
.WB_global_nav_us.WB_global_nav_us .gn_logo .box .logo,
.WB_global_nav_us.WB_global_nav_us .gn_logo .box img { display: block; }
.WB_global_nav.WB_global_nav .gn_logo .box .logo { margin-left: 0; }
.WB_global_nav_us.WB_global_nav_us .gn_position { margin-right: 0; }
`);
        observer.dom.remove(moveNavList);
      };
      observer.dom.add(moveNavList);
    },
  });

  Object.assign(i18n, {
    navHideName: { cn: '导航栏上的用户名|{{act}} (V6){{i}}', tw: '導覽列上的用戶名|{{act}} (V6){{i}}', en: 'Username on nav bar would be | {{act}} (V6){{i}}' },
    navHideNameReplace: { cn: '替换为“个人主页”', tw: '替換為「個人主頁」', en: 'replaced by text "My Profile"' },
    navHideNameHidden: { cn: '隐藏', tw: '隱藏', en: 'hidden' },
    navHideNameDetail: {
      cn: '此外您还可以隐藏隐藏右栏的 [[clean_right_info]] 模块。以及打开 [[layout_nav_auto_hide]] 。',
    },
    navHideNameReplaceText: { cn: '个人主页', tw: '個人主頁', en: 'My Profile' },
  });

  const hideNavName = css.add('.yawf-WBV6 .WB_global_nav .gn_nav_list li.gn_name.S_txt1 { display: none; }');
  navbar.navHideName = rule.Rule({
    id: 'layout_nav_hide_name',
    version: 1,
    parent: navbar.navbar,
    template: () => i18n.navHideName,
    ref: {
      act: {
        type: 'select',
        select: [
          { value: 'hidden', text: () => i18n.navHideNameHidden },
          { value: 'replace', text: () => i18n.navHideNameReplace },
        ],
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.navHideNameDetail },
    },
    init() {
      if (this.getConfig()) {
        if (this.ref.act.getConfig() === 'replace') {
          css.append(`
.WB_global_nav .gn_nav_list li .gn_name .S_txt1::before { content: "${i18n.navHideNameReplaceText}"; display: block; }
.WB_global_nav .gn_nav_list li .gn_name .S_txt1 { height: 26px; display: inline-block; width: 4em; }
`);
        } else {
          css.append('.WB_global_nav .gn_nav_list li a.gn_name .S_txt1 { display: none; }');
        }
      }
      hideNavName.remove();
    },
  });

  Object.assign(i18n, {
    navHideAvatar: { cn: '导航栏不显示个人头像 (V7)' },
  });
  const hideNavAvatar = css.add('.yawf-WBV7 [class*="Ctrls_avatarItem_"] { visibility: hidden; }');
  navbar.navHideAvatar = rule.Rule({
    weiboVersion: 7,
    id: 'layout_nav_hide_avatar',
    version: 85,
    parent: navbar.navbar,
    template: () => i18n.navHideAvatar,
    init() {
      hideNavAvatar.remove();
      if (!this.getConfig()) return;
      const sprite = document.getElementById('__SVG_SPRITE_NODE__');
      const svg = new DOMParser().parseFromString(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
<symbol xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 30 30" id="nav-profile">
<path d="m21.916 10.4q0-1.8589-0.93159-3.45-0.93157-1.5911-2.5263-2.5205-1.5947-0.92946-3.4579-0.92946-1.8632 0-3.4579 0.92946-1.5947 0.92943-2.5263 2.5205-0.93158 1.5911-0.93158 3.45 0 1.7329 0.82105 3.2452 0.82106 1.5123 2.2105 2.4575-1.8632 0.75616-3.2842 2.174-1.4211 1.4178-2.2105 3.2452-0.82105 1.8904-0.82105 3.9699 0 0.40958 0.28421 0.7089 0.2842 0.29932 0.69474 0.29932h18.442q0.41052 0 0.69474-0.29932 0.28421-0.29932 0.28421-0.7089 0-2.0795-0.82105-3.9699-0.78948-1.8274-2.2105-3.2452-1.4211-1.4178-3.2842-2.174 1.3895-0.94521 2.2105-2.4575 0.82106-1.5123 0.82106-3.2452zm-6.9158 4.663q-1.2632 0-2.3368-0.63014-1.0737-0.63014-1.7053-1.7014-0.63158-1.0712-0.63158-2.3315 0-1.2603 0.63158-2.3315 0.63158-1.0712 1.7053-1.7014 1.0737-0.63014 2.3368-0.63014 1.2632 0 2.3368 0.63014 1.0737 0.63014 1.7053 1.7014 0.63158 1.0712 0.63158 2.3315 0 1.2603-0.63158 2.3315-0.63158 1.0712-1.7053 1.7014-1.0737 0.63014-2.3368 0.63014zm-8.1789 9.452q0.25264-2.0164 1.4053-3.6705 1.1526-1.6541 2.9368-2.5993 1.7842-0.94521 3.8368-0.94521 2.0526 0 3.8368 0.94521 1.7842 0.94519 2.9368 2.5993 1.1526 1.6541 1.4053 3.6705z"/>
</symbol>
<symbol xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 30 30" id="nav-profileFlat">
<path d="m21.916 10.4c0-1.2393-0.31053-2.3893-0.93159-3.45-0.62104-1.0607-1.4632-1.9009-2.5263-2.5205-1.0632-0.61964-2.2158-0.92946-3.4579-0.92946-1.2421 0-2.3947 0.30982-3.4579 0.92946-1.0632 0.61962-1.9053 1.4598-2.5263 2.5205-0.62106 1.0607-0.93158 2.2108-0.93158 3.45 0 1.1552 0.27368 2.237 0.82105 3.2452 0.54737 1.0082 1.2842 1.8274 2.2105 2.4575-1.2421 0.50411-2.3368 1.2288-3.2842 2.174-0.94737 0.94521-1.6842 2.0269-2.2105 3.2452-0.54737 1.2603-0.82105 2.5835-0.82105 3.9699 0 0.27306 0.094737 0.50936 0.28421 0.7089 0.18947 0.19955 0.42105 0.29932 0.69474 0.29932h18.442c0.27368 0 0.50526-0.09977 0.69474-0.29932 0.18947-0.19955 0.28421-0.43585 0.28421-0.7089 0-1.3863-0.27368-2.7096-0.82105-3.9699-0.52632-1.2183-1.2632-2.3-2.2105-3.2452-0.94737-0.94521-2.0421-1.6699-3.2842-2.174 0.92632-0.63014 1.6632-1.4493 2.2105-2.4575 0.54737-1.0082 0.82106-2.0899 0.82106-3.2452z" fill="currentColor"/>
</symbol>
</svg>`, 'image/svg+xml');
      [...svg.querySelectorAll('symbol')].forEach(symbol => sprite.appendChild(symbol));
      util.inject(function (rootKey) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        vueSetup.eachComponentVM('ctrls', function (vm) {
          vm.$watch(function () { return this.navItems; }, function () {
            const profile = vm.navItems.find(item => item.name === 'profile');
            if (profile?.src) profile.src = '';
            vm.$forceUpdate();
          }, { deep: true, immediate: true });
        });
      }, util.inject.rootKey);
    },
  });

}());
