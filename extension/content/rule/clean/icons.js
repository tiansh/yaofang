; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const observer = yawf.observer;

  const i18n = util.i18n;
  const css = util.css;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanIconsGroupTitle: { cn: '隐藏模块 - 标识/图标', tw: '隱藏模組 - 標誌/圖示', en: 'Hide Modules - Logo / Icons' },
    cleanIconsMember: { cn: '微博会员', tw: '微博會員', en: 'Weibo VIP / Member' },
    cleanIconsLevel: { cn: '等级', tw: '等級', en: 'Level' },
    cleanIconsApprove: { cn: '个人认证', tw: '個人認證', en: 'Personal Authentication' },
    cleanIconsApproveCo: { cn: '机构认证', tw: '企業認證', en: 'Weibo Verification' },
    cleanIconsApproveDead: { cn: '失效认证', tw: '失效認證', en: 'Failed verification' },
    cleanIconsBigFun: { cn: '铁粉', tw: '鐵粉', en: '铁粉 (big funs?)' },
    cleanIconsClub: { cn: '微博达人', tw: '微博達人', en: 'Pioneer' },
    cleanIconsVGirl: { cn: '微博女郎', en: 'Weibo girl' },
    cleanIconsSupervisor: { cn: '微博监督员', tw: '微博監督員', en: 'Weibo Supervisor' },
    cleanIconsTaobao: { cn: '淘宝/天猫商户', tw: '淘寶/天貓商戶', en: 'Taobao / Tmall Merchant' },
    cleanIconsCheng: { cn: '阿里诚信通', tw: '阿里誠信通', en: 'Alibaba 诚信通' },
    cleanIconsGongyi: { cn: '公益', en: 'Public Interest' },
    cleanIconsZongyika: { cn: '综艺', en: 'Variety' },
    cleanIconsYouji: { cn: '旅行', en: 'Travel' },
    cleanIconsOthers: { cn: '更多', tw: '其他', en: 'More' },
  });

  const showIcons = classNames => ({
    afterRender: container => {
      const label = container.querySelector('label');
      classNames.forEach(className => {
        const container = document.createElement('span');
        container.innerHTML = '<i class="W_icon" style="display:inline-block!important"></i>';
        const i = container.querySelector('i');
        if (typeof className === 'string') {
          i.classList.add(className);
        } else if (Array.isArray(className)) {
          i.className = className.join(' ');
        }
        label.appendChild(container);
      });
      return container;
    },
  });

  clean.CleanGroup('icons', () => i18n.cleanIconsGroupTitle);
  clean.CleanRule('level', () => i18n.cleanIconsLevel, 1, '.icon_bed[node-type="level"], .W_level_ico, .W_icon_level { display: none !important; }');
  const member = clean.CleanRule('member', () => i18n.cleanIconsMember, 1, '[class*="icon_member"], [class*="ico_member"], [class*="ico_vip"], [class*="icon_vip"] { display: none !important; }', showIcons(['icon_member1']), { weiboVersion: [6, 7] });
  const approve = clean.CleanRule('approve', () => i18n.cleanIconsApprove, 1, '.approve, .icon_approve, .icon_pf_approve, .icon_approve_gold, .icon_pf_approve_gold { display: none !important; }', showIcons(['icon_approve', 'icon_approve_gold']), { weiboVersion: [6, 7] });
  const approveCo = clean.CleanRule('approve_co', () => i18n.cleanIconsApproveCo, 1, '.approve_co, .icon_approve_co, .icon_pf_approve_co, [class^="W_icon_co"], [class^=".icon_approve_co_"], [class^=".icon_pf_approve_co_"] { display: none !important; }', showIcons(['icon_approve_co']), { weiboVersion: [6, 7] });
  clean.CleanRule('approve_dead', () => i18n.cleanIconsApproveDead, 1, '.icon_approve_dead, .icon_pf_approve_dead { display: none !important; }', showIcons(['icon_approve_dead']));
  clean.CleanRule('bigfun', () => i18n.cleanIconsBigFun, 26, '.W_icon_bf { display: none !important; }', showIcons([['W_icon_bf', 'icon_bigfans']]));
  const club = clean.CleanRule('club', () => i18n.cleanIconsClub, 1, '.ico_club, .icon_pf_club, .icon_club { display: none !important; }', showIcons(['icon_club']), { weiboVersion: [6, 7] });
  const vGirl = clean.CleanRule('v_girl', () => i18n.cleanIconsVGirl, 1, '.ico_vlady, .icon_pf_vlady, .icon_vlady { display: none !important; }', showIcons(['icon_vlady']), { weiboVersion: [6, 7] });
  clean.CleanRule('supervisor', () => i18n.cleanIconsSupervisor, 1, '.icon_supervisor { display: none !important; }', showIcons(['icon_supervisor']));
  clean.CleanRule('taobao', () => i18n.cleanIconsTaobao, 1, '.ico_taobao, .icon_tmall, .icon_taobao, .icon_tmall { display: none !important; }', showIcons(['icon_taobao', 'icon_tmall']));
  clean.CleanRule('cheng', () => i18n.cleanIconsCheng, 1, '.icon_cheng { display: none !important; }', showIcons(['icon_cheng']));
  clean.CleanRule('gongyi', () => i18n.cleanIconsGongyi, 1, '.ico_gongyi, .ico_gongyi1, .ico_gongyi2, .ico_gongyi3, .ico_gongyi4, .ico_gongyi5, .icon_gongyi, .icon_gongyi2, .icon_gongyi3, .icon_gongyi4, .icon_gongyi5 { display: none !important; }', showIcons(['icon_gongyi']));
  clean.CleanRule('zongyika', () => i18n.cleanIconsZongyika, 1, '.zongyika2014, .icon_zongyika2014 { display: none !important; }', showIcons(['icon_zongyika2014']));
  clean.CleanRule('others', () => i18n.cleanIconsOthers, 1, () => {
    observer.dom.add(function () {
      const icons = Array.from(document.querySelectorAll('a > .W_icon_yystyle'));
      icons.forEach(function (icon) {
        const link = icon.parentNode;
        const replacement = document.createElement('span');
        replacement.title = link.title;
        link.parentNode.replaceChild(replacement, link);
      });
    });
    css.append('.W_icon_yystyle, .W_icon_yy { display: none !important; }');
  }, showIcons(['icon_yy_ssp1', 'icon_yy_gqt', 'icon_yy_lol']));

  clean.CleanRuleGroup({
    'vyellow,vgold': approve,
    vblue: approveCo,
    vgirl: vGirl,
    club: club,
    'vip,vipex': member,
  }, function (options) {
    if (yawf.weiboVersion !== 7) return;
    const hideSymbol = Object.keys(options).filter(key => options[key]).join(',').split(',');

    util.inject(function (rootKey, hideSymbol) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      const wooIcon = vueSetup.getRootVm().$options._base.component('woo-icon');
      wooIcon.options.render = (function (render) {
        return function (h) {
          if (hideSymbol.includes(this.symbol)) {
            return h('span', { ref: 'frames', style: 'display: none;' });
          }
          return render.call(this, h);
        };
      }(wooIcon.options.render));

      vueSetup.eachComponentVM('woo-icon', vm => { vm.$forceUpdate(); }, { watch: false });
      vueSetup.eachComponentVM('icon', vm => {
        if (Object.getPrototypeOf(vm) === wooIcon.prototype) vm.$forceUpdate();
      }, { watch: false });
    }, util.inject.rootKey, hideSymbol);
  });

}());
