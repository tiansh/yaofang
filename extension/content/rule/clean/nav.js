; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const backend = yawf.backend;
  const observer = yawf.observer;

  const clean = yawf.rules.clean;

  const i18n = util.i18n;

  Object.assign(i18n, {
    cleanNavGroupTitle: { cn: '隐藏模块 - 导航栏', tw: '隱藏模組 - 導覽列', en: 'Hide Modules - Navigation Bar' },
    cleanNavLogoImg: { cn: '节日徽标', tw: '節日徽標', en: 'Holiday logo' },
    cleanNavMain: { cn: '首页', tw: '首頁', en: 'Home' },
    cleanNavTV: { cn: '视频', en: '视频 (Video)' },
    cleanNavHot: { cn: '发现', en: 'Discover' },
    cleanNavGame: { cn: '游戏', tw: '遊戲', en: 'Game' },
    cleanNavHotSearch: { cn: '大家正在搜', tw: '大家正在熱搜', en: 'Hot search' },
    cleanNavNoticeNew: { cn: '新消息计数', tw: '新消息計數', en: 'Count for new notice' },
    cleanNavNew: { cn: '提示红点', tw: '提示紅點', en: 'Red dot tips' },
  });

  clean.CleanGroup('_nav', () => i18n.cleanNavGroupTitle);
  clean.CleanRule('logoImg', () => i18n.cleanNavLogoImg, 1, {
    ainit: function () {
      const rule = this;
      observer.dom.add(function replaceLogo() {
        const box = document.querySelector('.WB_global_nav .gn_logo .box');
        if (!box) { setTimeout(replaceLogo, 100); return; }
        const img = box.getElementsByTagName('img')[0];
        if (!img) return;
        const logo = document.createElement('span');
        logo.classList.add('logo');
        img.replaceWith(logo);
      });
    },
    acss: '.WB_global_nav .gn_logo .box img { display: none !important; }',
  });
  clean.CleanRule('main', () => i18n.cleanNavMain, 1, '.gn_nav_list>li:nth-child(1) { display: none !important; }');
  clean.CleanRule('tv', () => i18n.cleanNavTV, 1, '.gn_nav_list>li:nth-child(2) { display: none !important; }');
  clean.CleanRule('hot', () => i18n.cleanNavHot, 1, '.gn_nav_list>li:nth-child(3) { display: none !important; }');
  clean.CleanRule('game', () => i18n.cleanNavGame, 1, '.gn_nav_list>li:nth-child(4) { display: none !important; }');
  clean.CleanRule('hotSearch', () => i18n.cleanNavHotSearch, 1, {
    init: function () {
      const rule = this;
      backend.onRequest('hotSearch', details => {
        if (this.isEnabled()) return { cancel: true };
        return {};
      });
    },
  });
  clean.CleanRule('noticeNew', () => i18n.cleanNavNoticeNew, 1, '.WB_global_nav .gn_set_list .W_new_count { display: none !important; }');
  clean.CleanRule('new', () => i18n.cleanNavNew, 1, '.WB_global_nav .W_new { display: none !important; }');

}());
