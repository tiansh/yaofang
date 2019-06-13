// 这个文件用于向界面上添加漏斗图标和菜单项

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const i18n = util.i18n;

  const rule = yawf.rule;

  i18n.filterMenuItem = {
    cn: '过滤器设置',
    tw: '篩選器設定',
    en: 'Filter Settings',
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
`;

  const searchStyle = util.css.add(searchCss);
  const iconStyle = util.css.add(iconCss);
  init.onDeinit(() => {
    searchStyle.remove();
    iconStyle.remove();
  });

  const onClick = function (e) {
    try {
      rule.dialog();
    } catch (e) { util.debug('Error while prompting dialog: %o', e); }
    e.preventDefault();
  };
  init.onLoad(() => {
    const icon = function () {
      const reference = document.querySelector('.WB_global_nav .gn_set_list');
      if (!reference) { setTimeout(icon, 100); return; }
      const template = document.createElement('template');
      template.innerHTML = `<div class="gn_set_list yawf-gn_set_list"><a node-type="filter" href="javascript:void(0);" class="gn_filter"><em class="W_ficon ficon_mail S_ficon">Y</em></a></div>`;
      const container = document.importNode(template.content.firstElementChild, true);
      const button = container.querySelector('.gn_filter');
      reference.before(container);
      button.setAttribute('title', i18n.filterMenuItem);
      button.addEventListener('click', onClick);
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
    };
    if (['search', 'ttarticle'].includes(init.page.type())) return;
    icon(); menuitem();
  });

}());
