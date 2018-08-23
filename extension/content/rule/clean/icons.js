
; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const clean = yawf.rules.clean;

  const i18n = util.i18n;

  Object.assign(i18n, {
    cleanIconsGroupTitle: { cn: '隐藏模块 - 标识/图标', tw: '隱藏模組 - 標誌/圖示', en: 'Hide Modules - Logo / Icons' },
    cleanIconsMember: { cn: '微博会员', tw: '微博會員', en: 'Weibo VIP / Member' },
  });

  const showIcons = classNames => ({
    rendered: rule => {
      const label = rule.querySelector('label');
      classNames.forEach(className => {
        const container = document.createElement('span');
        container.innerHTML = '<i class="W_icon" style="display:inline-block!important"></i>';
        const i = container.querySelector('i');
        i.classList.add(className);
        label.appendChild(container);
      });
      return rule;
    },
  });

  clean.CleanGroup('icons', () => i18n.cleanIconsGroupTitle);
  clean.CleanRule('member', () => i18n.cleanIconsMember, 1, '[class*="icon_member"], [class*="ico_member"], [class*="ico_vip"], [class*="icon_vip"] { display: none !important; }', showIcons(['icon_member1']));


}());
