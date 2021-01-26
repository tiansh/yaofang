// 这个文件用于向界面上添加漏斗图标和菜单项

; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;
  const observer = yawf.observer;
  const pagemenu = yawf.pagemenu;

  const i18n = util.i18n;

  const rule = yawf.rule;

  i18n.filterMenuItem = {
    cn: '药方设置',
    tw: '藥方設定',
    en: 'YAWF Settings',
  };

  // 缩小搜索框宽度以留出漏斗按钮的位置
  const searchCss = `
.WB_global_nav .gn_search_v2 { width: 178px !important; }
.WB_global_nav .gn_search_v2 .placeholder, .WB_global_nav .gn_search_v2 .W_input { width: 135px !important; }
.gn_topmenulist_search { width: 180px !important; }
@media screen and (min-width:1295px) {
  .WB_global_nav .gn_search_v2 { width: 435px !important; }
  .WB_global_nav .gn_search_v2 .placeholder, .WB_global_nav .gn_search_v2 .W_input { width: 392px !important; }
  .gn_topmenulist_search { width: 437px !important; }
}
@media screen and (max-width:1006px) {
  .WB_global_nav .gn_search_v2 { width: 115px !important; }
  .WB_global_nav .gn_search_v2 .placeholder, .WB_global_nav .gn_search_v2 .W_input { width: 72px !important; }
  .gn_topmenulist_search { width: 117px !important; }
}
.gn_topmenulist_search { min-width: 200px !important; }
`;
  // 添加漏斗图标的定义
  const iconCss = `
.gn_filter .W_ficon { font-family: "yawf-iconfont" !important; }
@font-face { font-family: "yawf-iconfont"; font-style: normal; font-weight: normal; src: url("data:image/woff;base64,d09GRk9UVE8AAAPIAAoAAAAABbQAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABDRkYgAAAA9AAAANUAAADot8EQFkZGVE0AAAHMAAAAGgAAABxtAw0mT1MvMgAAAegAAABJAAAAYFmdYldjbWFwAAACNAAAADgAAAFCAA0DAGhlYWQAAAJsAAAAMAAAADYD5a1oaGhlYQAAApwAAAAdAAAAJAaAA4BobXR4AAACvAAAAAgAAAAICAAAd21heHAAAALEAAAABgAAAAYAAlAAbmFtZQAAAswAAADkAAAB1Hh5OPRwb3N0AAADsAAAABYAAAAg/4YAM3icVY2xagJBFADfO+9O1GNNJBcLFwWxPLUXAumvDekPQUmjTYjYCNbP0sLO+Ak2NsLWfkN+ZN/ebiTaBG6qqWYQfB8QUSyzxaT/MZ7PJvPZJ6AHCC/c8liWuOlvImxXofL1PiT6l6isa7aZt00SSFjVJcCDhPWjBCHhpwHePSGgVQgXLzdG4CF230hxqlApc1El9ZwP+HgdhMqtYk7NxaVlkVdMEn+T3bkeuY7dE3HH7rgX8PD3NT7oc6gzfXJT0pk9kT0HIt8+UbzYm4RCiqp/hZJWXgAAAHicY2BgYGQAgjO2i86D6AtJW7VhNABKVQagAAB4nGNgZmFg/MLAysDBNJPpDAMDQz+EZnzNYMzIycDAxMAGJKGAkQEJBKS5pjA4MEQyRDLr/NdhiGGawdCMUAPkKQAhIwBYTwumAAAAeJxjYGBgZoBgGQZGBhCwAfIYwXwWBgUgzQKEIH7k//8Q8v8KqEoGRjYGGJP6gGYGUxcAAJgrBwx4nGNgZGBgAOK+F//94vltvjJwszCAwIWkrdpwuvx/LXMX0wwgl4OBCSQKAFMCC7x4nGNgZGBgmvG/liGGhQEEmLsYGBlQARMAU6MDCAAAAAQAAAAEAAB3AABQAAACAAB4nJWPwWoCMRCGv+gqihV6KB7EQ85ClmTxJL12n0C8i+zKXjawCuKLeOn79EH6BH2ETnSglFJoA0m+mf+fzAR44IohLcOUhXKPEc/KfZa8KmfieVceMDEj5SFT48VpsrFk5reqxD0epfrOfTa8KGfieVMeMONDecjcPHFhx5kaR8OeSCuczhNcdufaNfvY1rGV8If+JZWaSnfHgQpLQY6Xey379yZ3PbASLYjfSZ2/xZTydBm7Q2WL3Nu1/TaOxGHlgneFD+L9+y+2MlzHUXxJT63TmGyr7tjE1obc/+O1T5RwTOJ4nGNgZgCD/80MRkCKkQENAAAoVQG5AAA=") format("woff"); }
.gn_topmenulist_yawf { top: 34px; right: -17px; width: 134px; }
.yawf-drop-area-active .gn_topmenulist_yawf { display: none; }
`;

  const searchStyle = util.css.add(searchCss);
  const iconStyle = util.css.add(iconCss);
  init.onDeinit(() => {
    searchStyle.remove();
    iconStyle.remove();
  });

  const onClick = function (event, tab = null) {
    try {
      rule.dialog(tab);
    } catch (e) { util.debug('Error while prompting dialog: %o', e); }
    event.preventDefault();
  };

  // 给漏斗图标添加一个菜单
  const addScriptMenu = function (container) {
    const menuList = document.createElement('div');
    menuList.innerHTML = '<div class="gn_topmenulist gn_topmenulist_yawf" node-type="msgLayer" style="display: none;"><ul></ul><div class="W_layer_arrow"><span class="W_arrow_bor W_arrow_bor_t"><i class="S_line3"></i><em class="S_bg2_br"></em></span></div></div>';
    container.appendChild(menuList.firstChild);
    const dropdown = container.querySelector('.gn_topmenulist_yawf');
    const ul = dropdown.querySelector('ul');
    // 允许其他功能向菜单里面塞东西
    pagemenu.ready(ul);
    // 在鼠标移入或获得焦点时展示下拉菜单
    const addTempClassName = async function (classNames, delay) {
      await new Promise(resolve => setTimeout(resolve, 0));
      dropdown.classList.add(...classNames);
      await new Promise(resolve => setTimeout(resolve, delay));
      dropdown.classList.remove(...classNames);
    };
    let mouseInCount = 0, shown = false;
    const showDropdown = function () {
      mouseInCount++;
      if (!shown) {
        shown = true;
        dropdown.style.display = 'block';
        addTempClassName('UI_speed_fast', 'UI_ani_fadeInDown', 200);
      }
    };
    const hideDropdown = async function () {
      const lastInCount = mouseInCount;
      await new Promise(resolve => setTimeout(resolve, 200));
      if (lastInCount !== mouseInCount) return;
      if (shown) {
        shown = false;
        await addTempClassName('UI_speed_fast', 'UI_ani_fadeOutUp', 200);
        if (lastInCount !== mouseInCount) return;
        dropdown.style.display = 'none';
      }
    };
    container.addEventListener('mouseenter', showDropdown);
    container.addEventListener('mouseleave', hideDropdown);
    container.addEventListener('focusin', showDropdown);
    container.addEventListener('focusout', hideDropdown);

    // 添加菜单项，跳转到设置页面的各标签页
    rule.tabs.forEach((tab, index) => {
      if (!tab.pagemenu) return;
      pagemenu.add({
        title: tab.template,
        onClick: event => onClick(event, tab),
        order: index,
      });
    });

    // 如果点击了漏斗图标，我们会直接显示设置窗口，但如果是触摸点击的，我们先显示下拉菜单
    const onTouch = function (event) {
      if (shown) return;
      showDropdown();
      event.preventDefault();
      event.stopPropagation();
    };
    container.addEventListener('touchstart', onTouch, true);
  };
  init.onLoad(() => {
    const icon = function () {
      const reference = document.querySelector('.WB_global_nav .gn_set_list');
      if (!reference) { setTimeout(icon, 100); return; }
      const template = document.createElement('template');
      template.innerHTML = `<div class="gn_set_list yawf-gn_set_list"><a node-type="filter" href="javascript:void(0);" class="gn_filter"><em class="W_ficon ficon_mail S_ficon">Y</em></a></div>`;
      const container = document.importNode(template.content.firstElementChild, true);
      const button = container.querySelector('.gn_filter');
      button.setAttribute('title', i18n.filterMenuItem);
      button.addEventListener('click', onClick);
      reference.before(container);
      setTimeout(async () => {
        await searchStyle.ready;
        const [{ width, height }] = button.getClientRects();
        const size = width * height;
        // 如果用户选择不显示漏斗按钮，那么要恢复搜索框的宽度
        // 扩展不提供显示或不显示的选项，但是会提供自定义 CSS 功能
        if (!size) searchStyle.remove();
      }, 0);
    };
    const menuitem = function () {
      const menuitems = document.querySelectorAll('.gn_topmenulist ul li.line');
      if (!menuitems || !menuitems.length) { setTimeout(menuitem, 100); return; }
      const reference = [...menuitems].pop();
      const ul = document.createElement('ul');
      ul.innerHTML = `
<li class="line S_line1 yawf-config-menuline"></li>
<li><a href="javascript:void(0);" class="yawf-config-menuitem"></a></li>
`;
      const container = document.importNode(ul, true);
      const item = container.querySelector('.yawf-config-menuitem');
      item.addEventListener('click', onClick);
      item.textContent = i18n.filterMenuItem;
      reference.before(...container.children);

      const iconContainer = document.querySelector('.yawf-gn_set_list');
      addScriptMenu(iconContainer);
    };
    if (['search', 'ttarticle'].includes(init.page.type())) return;
    if (yawf.WEIBO_VERSION === 7) {
      searchStyle.remove();
      iconStyle.remove();
      return;
    }
    icon(); menuitem();
  });

  init.onLoad(() => {
    observer.dom.add(function fixNavBarUS() {
      // 统一海外版导航栏
      const navUs = document.querySelector('.WB_global_nav_us');
      if (navUs) navUs.classList.remove('WB_global_nav_us');
    });
  });

}());

; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;
  const rule = yawf.rule;

  const showRuleDialog = function (tab = null) {
    try {
      rule.dialog(tab);
    } catch (e) { util.debug('Error while prompting dialog: %o', e); }
  };

  init.onLoad(() => {
    if (yawf.WEIBO_VERSION !== 7) return;
    util.inject(function (rootKey, showRuleDialog) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      vueSetup.eachComponentVM('weibo-top-nav', function (vm) {
        vm.configs.splice(-1, 0, {
          divider: true,
          href: '',
          name: '药方设置',
          type: 'yawf-config',
        });
        vm.configHandle = (function (configHandle) {
          return function (index) {
            if (this.configs[index].type === 'yawf-config') {
              this.configClose = true;
              showRuleDialog();
            } else {
              configHandle.call(this, index);
            }
          }.bind(vm);
        }(vm.configHandle));
      });
    }, util.inject.rootKey, showRuleDialog);
  });

}());
