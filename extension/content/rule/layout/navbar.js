; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;

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
    id: 'autoHide',
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
.WB_global_nav[${attr}]::after { content: " "; width: 100%; height: 8px; clear: both; float: left; background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 75%, transparent 100%); }
/* 固定小黄签位置 */
.WB_global_nav[${attr}] .gn_topmenulist_tips { padding-top: 52px; transition: padding-top ease-in-out 0.1s 0.33s; }
.WB_global_nav[${attr}]:hover .gn_topmenulist_tips { padding-top: 2px; transition: padding-top ease-in-out 0.1s 0s; }
.WB_global_nav[${attr}] .gn_topmenulist_tips .ficon_close { top: 56px; transition: top ease-in-out 0.1s 0.33s; }
.WB_global_nav[${attr}]:hover .gn_topmenulist_tips .ficon_close { top: 6px; transition: top ease-in-out 0.1s 0s; }
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
    id: 'oldLayout',
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


}());
