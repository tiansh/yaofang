; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;
  const ui = util.ui;

  const theme = layout.theme = {};

  i18n.themeGroupTitle = {
    cn: '主题',
    tw: '主題',
    en: 'Theme',
  };

  theme.theme = rule.Group({
    parent: layout.layout,
    template: () => i18n.themeGroupTitle,
  });

  const skins = { skin: { _001: '蓝色心情', _002: '紫荆花瓣', _003: '沙滩漫步', _004: '凌晨两点半', _005: '梦幻星空', _006: '暗夜留香', _007: '我心飞翔', _008: 'happy forever', _009: '彩虹', _010: '梦幻游乐场', _011: '彩色天空', _012: '名人会', _013: '哇嗷', _014: '我愿意', _015: '猫趣', _016: '保护北冰洋', _017: '魅影', _018: '童趣彩虹', _019: 'kiss', _020: '漓彩', _021: '留沙', _022: '心晴', _023: 'greenway', _024: 'Hello Pig', _025: 'Iam 80后', _026: '安静夜', _027: '百灵鸟', _028: '碧草蓝天', _029: '窗台', _030: '梦幻', _031: '飞鸟鱼', _032: '粉色风信子', _034: '复古', _035: '黑板', _036: '咖啡', _037: '情迷宝丽来', _038: '太空', _039: '涂鸦板', _040: '星空', _041: '雨夜', _042: '纸飞机', _043: '飘', _045: 'pop', _046: '紫色风情', _047: 'coffee bar', _048: '风轻云淡', _049: '风轻云淡', _050: '梦幻星空', _051: '保护北冰洋', _052: '漓彩', _053: '情迷宝丽来', _054: '太空', _055: '雨夜', _058: '默认', _211: '我们结婚吧', _212: '幸福在身边', _214: '新年闹春', _252: '环保益起来', _253: '地球一小时', _254: '随手拍', _255: '为爱益起跑' }, skinvip: { _001: '鸟人的异想世界', _002: '纸面人生', _006: '简约生活', _009: '游戏时光', _010: '秀出真我', _011: '糖果缤纷', _013: '我的翅膀', _014: '莲花', _016: '超级玛丽', _017: '浪小花', _018: '80后', _019: '可爱滴兔子', _021: '海底世界', _022: '给自己放个假', _023: '80后的回忆', _024: '马戏团', _025: '孤独的夜', _026: '暖暖', _027: '吃豆人', _028: 'rainbow', _031: '海之梦境', _032: '旋转时光', _033: '午后巴士情缘', _034: '小黄鸭', _035: '夏微凉', _036: '碧水晚舟', _037: 'Marry Me', _038: '水墨鱼', _039: '夕影', _040: '心之恋', _041: '心心相印', _042: '旅行时光', _043: '拥抱美好', _044: '寐', _045: '狗狗漫步', _046: '阿狸的海洋', _047: '蒲公英的梦', _048: '播种阳光', _049: '小情人', _050: '海滩', _051: '天使爱人', _054: '悠闲午后', _056: '西瓜女孩', _057: '郊游', _058: '南极企鹅', _059: '老上海岁月', _060: '雾都', _061: '海边度假', _062: '一个人的旅行', _063: '环游地球', _064: '罗小黑的异想世界', _065: '李雷与韩梅', _068: '艾玩兔-守候', _069: '俏皮喵星人', _070: '梦游仙境', _071: '爱情畅想', _072: '萌狗狗', _073: '马背上的天空', _074: '暖阳', _075: '渔舟唱晚', _076: '小伙伴', _078: '简单生活', _079: '守望', _080: '好基友', _081: '都市流浪', _082: '躲猫猫', _083: '键盘仔', _084: '南瓜头快跑', _085: '飞向月球', _086: '枫林', _087: '柿子红了', _088: 'Trick or Treat', _089: '马里奥', _090: '天空', _091: '礼物轰炸机', _092: '阿狸的秋天', _093: '勇士狸', _094: '萌宠公寓', _095: '宁静的海', _096: '月光', _097: 'good night', _098: '喵星人向前冲', _099: '棒棒糖', _101: '童话', _102: '猫咪乐队', _105: '表白', _106: '自由猪神', _107: '梦中的小屋', _108: 'XOXO', _109: '童年的小熊', _110: '我的交响乐', _111: '仙乐飘飘', _112: '下雪啦', _113: '寒冬', _114: '后天', _115: '蛇年祝福', _116: '圣诞老人', _117: '江南style', _118: '龄官', _120: '迪士尼-史迪奇', _121: '迪士尼-维尼熊', _122: '迪士尼-小顽皮', _123: '迪士尼-玛丽猫', _124: '迪士尼-美人鱼', _125: '迪士尼-米奇米妮', _126: '迪士尼-欢乐圣诞', _127: '迪士尼-小仙女', _128: '守望', _129: '幽灵古堡', _130: '迷雾', _131: '金色阳光', _132: 'I Miss U', _133: '未来の树', _134: '金色海洋', _135: '雨后', _136: '草坡上的女孩', _137: 'Sexy music', _138: '移动城堡', _139: '拥抱爱', _140: '春草', _141: '花与蝶', _142: '樱の花', _145: '黑暗阶梯', _146: '鱼', _147: '公主', _149: '仙女的裙摆', _150: '小仙女', _152: '樱花舞', _153: '自娱自乐', _154: '哥哥', _156: '家有金毛', _158: '淘气小哈', _159: '海军狗狗', _160: '巴哥', _163: '迪士尼-魔境仙踪', _164: '迪士尼-公主', _165: '青春', _166: '花椅', _169: '拉拉', _173: '旧城往事', _174: '功夫之王', _175: '不明飞行物', _176: '星际探险', _178: '小泰迪', _179: '饼干喵星人', _181: '喵星人三兄弟', _182: '麋鹿喵星人', _185: '可爱喵星人', _187: '母爱', _188: '大手小手', _189: '一家人', _192: '钢铁侠', _193: '钢铁侠出击', _194: '迪士尼-米奇', _195: '迪士尼-米老鼠', _196: '萝莉', _197: '御姐', _198: '凝望地球', _199: '依靠', _201: 'CS战士', _202: 'Take Me Home', _203: '登船style', _204: '稻草人', _205: 'happy everyday', _206: '甜点', _207: '大风吹', _208: '烤红薯', _209: 'Ball', _211: '贪吃蛇', _212: '力争上游', _213: '棋逢对手', _214: '团团圆圆', _216: '年夜饭', _221: '春雨', _222: '尘飞扬', _224: '雾霾压城', _225: '仙女的舞蹈', _226: '旅行赏春', _227: '赏春去', _228: '极速飙车', _234: '喵星人的思念', _235: '二货喵星人', _236: '怀念', _237: '卖萌喵星人', _238: '金字塔的秘密', _239: '母亲节', _240: '端午节', _242: '盒子星球', _243: '心心相印', _244: '粉色心情', _245: '侏罗纪公园', _246: '世界杯', _247: '点球大战', _250: '杨洋', _251: '杨洋生日专属', _303: '纪念日', _304: '窗外的春天', _305: '速度与激情', _306: '绿意盎然', _307: '动画城', _310: '牧人', _311: '美好风光', _312: '春天的幻想', _318: '重返地球', _319: '冲上云霄', _320: '陨石', _325: '爱情使者', _326: '怪兽大学', _328: '毛怪和小伙伴', _330: '迪士尼-复古米老鼠', _332: '鱼跃', _333: '夜色', _334: '海洋', _335: '祈盼', _337: '玫瑰代表我的爱', _339: '神偷奶爸2', _342: '圣诞驯鹿', _343: '温情圣诞', _344: '冰雪奇缘', _345: '驯龙骑士', _347: '蝴蝶春天', _348: '绿色生活', _349: '彩色气球', _350: '雨滴', _351: '晴空暖阳', _354: '花瓣', _355: '春色', _358: 'keeny的咖啡', _359: 'keeny的鲸鱼', _400: '春天的气息', _401: '鬼娃娃', _402: '密室', _404: '竹林听雨', _405: '云雾', _407: '油菜花', _408: '旅途中的等待', _409: '旅程', _410: '汽车之旅', _411: '荷兰风车', _412: '迷彩之战', _414: '战地飞车', _415: '情侣喵星人', _416: '喵星人和鱼', _417: '一起午觉', _419: '爱心磁带', _420: '来自星星的我', _422: '欢乐喵星人', _423: '私家飞碟', _425: '乐队', _600: '家', _702: '纪念泰戈尔', _704: 'TFBOYS少年强', _709: 'TFBOYS青春修炼手册', _711: '新版微博', _713: '探寻幸福', _714: '夏天你好', _715: '我爱火锅', _716: '红色巴士', _717: '仰望星空', _718: 'happy birthday', _719: '银杏知秋', _722: '玩雪咯', _723: '喵星人的星际穿越', _724: 'Jingle bells', _725: '闹新春', _726: '三羊开泰', _731: '7月日历', _732: '8月日历', _733: '9月日历', _734: '10月日历', _735: '11月日历', _736: '12月日历', _737: '1月日历', _738: '2月日历', _739: '3月日历', _740: '碧波', _741: '一猫一世界', _742: '呐喊的汪汪', _743: '家有馋猫', _744: '狗狗爱美丽', _745: '温柔如喵', _746: '藏猫猫', _747: '伴君旅行', _748: '我想静静', _749: '倾情', _750: '粼粼海光', _751: '华晨宇', _752: 'SNH48', _753: '诺言', _754: '乔振宇', _755: '妞妞和端午', _756: '暖暖屋', _757: '依偎ivvi', _800: 'TFBOYS易烊千玺', _801: '初雪', _802: '暖心拿铁', _803: '陪伴', _804: 'Merry Xmas', _805: '逆光森林', _806: '我爱披萨', _807: '旅行成瘾', _808: '我爱甜点', _809: '羊年到', _811: '希望之树', _812: '海洋', _813: '小岛和船', _814: '雪景', _815: '彩虹之路' }, skinvipf: { _001: '大海', _002: '下雪', _003: '天使', _004: '双子座', _005: '远行' }, skinvipg: { _001: '毕业季', _002: '上班族的周一', _003: '上班族的周二', _004: '上班族的周三', _005: '上班族的周四', _006: '上班族的周五', _007: '上班族的周六', _008: '上班族的周天' }, skinvipj: { _001: '超级玛丽动态版' }, weekskin: { _002: '微博经典' }, weekskinvip: { _001: '旅行时光', _002: '绿意', _003: '上班族一周心情', _004: '迪士尼' } };

  Object.assign(i18n, {
    setSkin: {
      cn: '统一所有页面的模板|{{skin}} {{i}}',
      tw: '統一所有頁面的模板|{{skin}} {{i}}',
      en: 'Show all pages with template | {{skin}} {{i}}',
    },
    setSkinDetail: {
      cn: '开启后所有页面将显示您选择的模板，包括其他用户的个人主页。模板不会覆盖您在主页自定义的背景图或配色，但是会覆盖个人主页的背景图或配色。模板效果仅在您的浏览器中生效，他人访问您的个人主页时，仍会看到您在微博中设置的模板。模板的选择请参考{{listpage}}，在模板商店中点击图片预览与应用模板。',
    },
    setSkinListPageTitle: {
      cn: '模板商店',
    },
    setSkinByPreviewTitle: {
      cn: 'Yet Another Weibo Filter 模板设置',
    },
    setSkinByPreview: {
      cn: '您要在药方扩展中使用“{1}”模板吗？启用后您访问各种页面时都将使用当前的模板。在脚本中使用皮肤不会影响其他用户查看您个人主页时的模板样式。',
      tw: '您要在藥方擴展中使用「{1}」模板嗎？啟用後您訪問各種頁面時都將使用當前的模板。在腳本中使用皮膚不會影響其他用戶查看您個人主頁時的模板樣式。',
      en: 'Do you want to enable the template "{1}" in YAWF? All pages will show current template if you choose enable it. The template only applied on your browser.',
    },
  });

  theme.apply = rule.Rule({
    id: 'layout_theme_apply',
    version: 1,
    parent: theme.theme,
    template: () => i18n.setSkin,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.setSkinDetail },
      skin: {
        type: 'select',
        initial: 'skin058',
        select: [].concat(...Object.keys(skins).sort().map(function (key) {
          const val = skins[key];
          return Object.keys(val).map(index => {
            const num = index.slice(1), skinId = key + num;
            return { value: skinId, text: val[index] + ' (' + skinId + ')' };
          });
        })),
      },
      listpage: {
        render() {
          const link = document.createElement('a');
          link.href = '//skin.vip.weibo.com/list?topnav=1&wvr=6';
          link.target = '_blank';
          link.textContent = i18n.setSkinListPageTitle;
          return link;
        },
      },
    },
    ainit() {
      const userConfigSkinId = this.ref.skin.getConfig();
      const skinId = new URLSearchParams(location.search).get('skinId') || userConfigSkinId;
      let version = '';
      let skinStyle = null, coverStyle = null;
      const setSkinId = function (skinId) {
        skinStyle.href = skinStyle.href.replace(/\/skin\/[^/]*\/skin.css/, `/skin/${skinId}/skin.css`);
        const coverCss = `#skin_cover_s { background-image: url("//img.t.sinajs.cn/t6/skin/${skinId}/images/profile_cover_s.jpg?version=${version}") !important; }`;
        (coverStyle || (coverStyle = document.head.appendChild(document.createElement('style')))).textContent = coverCss;
      };
      const setSkin = function setSkin() {
        // 头条文章页面设置模板会导致界面混乱
        if (init.page.type() === 'ttarticle') return;
        if (!skinStyle) {
          const skinCss = document.querySelector('link[href*="//img.t.sinajs.cn/t6/skin/"][href*="/skin.css?"]');
          if (!skinCss) return;
          version = ((skinCss.href.match(/version=([a-fA-F0-9]*)/) || [])[1]) || '';
          skinStyle = skinCss.cloneNode(); skinStyle.id = 'yawf-skin_style';
          setSkinId(skinId);
        }
        const isHome = document.body.matches('.FRAME_main');
        if (!document.getElementById('yawf-skin_style') ||
          // 微博不能保证 id 为 skin_style 的对象唯一，所以不能用 #skin_style 选择器，神奇吧
          document.querySelector('#yawf-skin_style ~ [id="skin_style"]') ||
          (!isHome && document.querySelector('#yawf-skin_style ~ [id="custom_style"]'))
        ) {
          setSkinId(skinId);
          document.head.appendChild(skinStyle);
        }
        // 如果是首页，而且使用了自定义模板；保证自定义模板优先级（但是在个人主页上覆盖自定义模板）
        if (isHome && document.querySelector('[id="custom_style"] ~ #yawf-skin_style')) {
          const customStyleList = document.querySelectorAll('[id="custom_style"]');
          const customStyle = customStyleList[customStyleList.length - 1];
          skinStyle.parentNode.insertBefore(customStyle, skinStyle.nextSibling);
        }
      };
      observer.dom.add(setSkin);
    },
    init() {
      const rule = this;
      (async function () {
        const search = new URLSearchParams(location.search);
        const skinId = search.get('skinId');
        if (!skinId) return;
        const name = skins[skinId.replace(/\d+$/, '')]['_' + skinId.replace(/^\D+/, '')];
        if (!name) return;
        const answer = await ui.confirm({
          id: 'yawf-use-skin',
          title: i18n.setSkinByPreviewTitle,
          text: i18n.setSkinByPreview.replace('{1}', () => name),
        });
        if (answer) {
          rule.ref.skin.setConfig(skinId);
          rule.setConfig(true);
          search.delete('skinId');
          location.search = search;
        }
      }());
    },
  });

  i18n.navbarDark = {
    cn: '深色主题导航栏',
    tw: '深色主題導覽列',
    en: 'Dark theme navbar',
  };

  theme.darkNav = rule.Rule({
    id: 'layout_nav_dark',
    version: 1,
    parent: theme.theme,
    template: () => i18n.navbarDark,
    acss: `
.WB_global_nav { background: #333; }
.WB_global_nav_alpha { background: rgba(51, 51, 51, 0.94); }
.gn_logo .logo:empty { background: none !important; }
.gn_logo .logo:empty::before, .gn_logo .logo:empty::after { content: " "; display: block; background: url("//img.t.sinajs.cn/t6/style/images/global_nav/WB_logo.png?id=1404211047727") no-repeat 0 40%; height: 48px; }
@media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-moz-min-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2) {
  .gn_logo .logo:empty::before, .gn_logo .logo:empty::after { background-image:url("//img.t.sinajs.cn/t6/style/images/global_nav/WB_logo-x2.png?id=1404211047727"); background-size:80px 27px; }
}
.gn_logo .logo:empty::before { width: 36px; float: left; }
.gn_logo .logo:empty::after { width: 104px; float: right; background-position: -36px 40%; }
.gn_logo .logo:empty::after { filter: url("data:image/svg+xml,%3Csvg%20viewBox=%220%200%20183%20276%22%20id=%22img3%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22invert%22%3E%3CfeComponentTransfer%3E%3CfeFuncR%20tableValues=%221%200%22%20type=%22table%22/%3E%3CfeFuncG%20tableValues=%221%200%22%20type=%22table%22/%3E%3CfeFuncB%20tableValues=%221%200%22%20type=%22table%22/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/svg%3E#invert"); -webkit-filter: invert(100%); filter: invert(100%); }
.FRAME_main .WB_global_nav .gn_nav_list li .home em { color: #fa7d3c; }
.WB_global_nav .S_ficon, .WB_global_nav .S_ficon_dis, .WB_global_nav a.S_ficon_dis:hover, .WB_global_nav a:hover .S_ficon_dis { color: #a6afbf; }
.WB_global_nav .S_txt1, .WB_global_nav .SW_fun .S_func1 { color: #eee; }
`,
  });

  i18n.colorOverride = {
    cn: '修改网页配色（半透明背景）||主背景色{{color2}}|透明度{{transparency2}}%||副背景色{{color1}}|透明度{{transparency1}}%||输入框背景色{{color3}}|透明度{{transparency3}}%',
    tw: '修改網頁配色（半透明背景）||主背景色{{color2}}|透明度{{transparency2}}%||副背景色{{color1}}|透明度{{transparency1}}%||輸入方塊背景色{{color3}}|透明度{{transparency3}}%',
    en: 'Change colors on page (Semi-transparent background) || Primary Background Color {{color2}} | transparency {{transparency2}}% || Secondary Background Color {{color1}} | transparency {{transparency1}}% || Input box {{color3}} | transparency {{transparency3}}%',
  };

  theme.color = rule.Rule({
    id: 'layout_theme_color',
    version: 1,
    parent: theme.theme,
    template: () => i18n.colorOverride,
    ref: {
      color1: { type: 'color', initial: '#f6f6f6' },
      transparency1: { type: 'range', min: 0, max: 100, initial: 30 },
      color2: { type: 'color', initial: '#ffffff' },
      transparency2: { type: 'range', min: 0, max: 100, initial: 30 },
      color3: { type: 'color', initial: '#ffffff' },
      transparency3: { type: 'range', min: 0, max: 100, initial: 30 },
    },
    ainit() {
      const colorStr = (color, transparency) => color + (256 | 255 * (1 - transparency / 100)).toString(16).slice(-2);
      const color1 = colorStr(this.ref.color1.getConfig(), this.ref.transparency1.getConfig());
      const color2 = colorStr(this.ref.color2.getConfig(), this.ref.transparency2.getConfig());
      const color3 = colorStr(this.ref.color3.getConfig(), this.ref.transparency3.getConfig());
      const notes = colorStr('#fff8bf', Math.round(100 - (100 - this.ref.transparency1.getConfig()) ** 3 / 1e4));
      css.append(`
body .S_bg1, body .SW_fun_bg:hover, body .SW_fun_bg_active { background-color: ${color1}; }
body .S_bg2, body blockquote, body .W_btn_b, body .W_input, body .SW_fun_bg { background-color: ${color2}; }
body .S_bg1_br { border-color: ${color1}; }
body .S_bg2_br { border-color: ${color2}; }
body .W_input, body .send_weibo .input { background-color: ${color3}; }

.S_bg2 .private_list.SW_fun_bg:not(.cur),
.WB_tab_a .tab .S_bg2 .S_bg2,
.S_bg2 .WB_webim_page .webim_contacts_mod
{ background-color: transparent; }

.WB_notes { background-color: ${notes} }

.W_arrow_bor_t i, .W_arrow_bor_t em { border-left-color: transparent; border-right-color: transparent; border-top-color: transparent; }
.W_arrow_bor_r i, .W_arrow_bor_r em { border-bottom-color: transparent; border-right-color: transparent; border-top-color: transparent; }
.W_arrow_bor_b i, .W_arrow_bor_b em { border-bottom-color: transparent; border-left-color: transparent; border-right-color: transparent; }
.W_arrow_bor_l i, .W_arrow_bor_l em { border-bottom-color: transparent; border-left-color: transparent; border-top-color: transparent; }

.WB_tab_a .tab_box_a_r2 .tab .li_first, .WB_tab_a .tab_box_a_r2 .tab .li_last { display: none; }
.WB_tab_a .tab_box_a .tab { display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-around; align-items: stretch; }

.WB_tab_a.WB_tab_a .tab .t { height: 38px; width: calc(100% - 16px); }
.WB_tab_a.WB_tab_a .tab .b { display: none; }
.WB_tab_a.WB_tab_a .tab_box_a .tab.clearfix::after { display: none; }
.WB_tab_a.WB_tab_a .tab_box_a .tab li { margin: 0; flex-grow: 1; }
.WB_tab_a.WB_tab_a .tab_box_a_r6 .t { width: calc(100% - 14px); }

.search_directarea, .WB_editor_iframe { background: none; }
.private_list_box .private_head { padding-bottom: 8px; }
.private_list_box .private_body { margin-top: 0; }
#weibochat { background: none; }
`);
    },
  });

}());
