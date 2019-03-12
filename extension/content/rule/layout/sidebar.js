; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;

  const sidebar = layout.sidebar = {};

  i18n.sidebarToolGroupTitle = {
    cn: '边栏',
    tw: '邊欄',
    en: 'Sidebar',
  };

  sidebar.sidebar = rule.Group({
    parent: layout.layout,
    template: () => i18n.sidebarToolGroupTitle,
  });

  const floatingAfterMerge = (prefer = 'left') => () => {
    if (!sidebar.floatingLeft.getConfig()) return;
    if (!sidebar.floatingRight.getConfig()) return;
    if (!sidebar.merge.getConfig()) return;
    if (prefer === 'left') {
      sidebar.floatingRight.setConfig(false);
    } else {
      sidebar.floatingLeft.setConfig(false);
    }
  };

  const sidebarOn = config => {
    if (sidebar.merge.ref.side.getConfig() !== config) {
      sidebar.merge.ref.side.setConfig(config);
    }
    if (sidebar.allSidebarOn.ref.side.getConfig() !== config) {
      sidebar.allSidebarOn.ref.side.setConfig(config);
    }
  };

  Object.assign(i18n, {
    sidebarShowMessages: {
      cn: '在首页左栏显示消息分组，包括以下链接{{i}}||{{atme}}|{{cmt}}|{{like}}|{{dm}}|{{msgbox}}|{{group}}|{{dmsub}}',
      tw: '在首頁左欄顯示消息分組，包括以下連結{{i}}||{{atme}}|{{cmt}}|{{like}}|{{dm}}|{{msgbox}}|{{group}}|{{dmsub}}',
      en: 'Show an link to new messages in left column of home page with following items {{i}}||{{atme}}|{{cmt}}|{{like}}||{{dm}}|{{msgbox}}|{{group}}|{{dmsub}}',
    },
    sidebarShowMessagesWarning: {
      cn: '在分辨率较小的屏幕上添加过多项目可能导致显示不完全。',
      tw: '熒幕解析度過小時加入過多連接可致無法完全顯示。',
      en: 'It may not displayed correctly if too many links added on a low resolution monitor.',
    },
    sidebarShowMessagesMsg: { cn: '消息', en: 'News' },
    sidebarShowMessagesAtMe: { cn: '@我的', tw: '@我的', en: 'Mentioned' },
    sidebarShowMessagesCmt: { cn: '评论', tw: '評論', en: 'Comment' },
    sidebarShowMessagesLike: { cn: '赞', tw: '讚', en: 'Like' },
    sidebarShowMessagesDM: { cn: '私信', en: 'Message' },
    sidebarShowMessagesMsgBox: { cn: '未关注人私信', tw: '未關注人私信', en: "Strangers' Messages" },
    sidebarShowMessagesGroup: { cn: '群通知', en: 'Group message' },
    sidebarShowMessagesDMSub: { cn: '订阅消息', tw: '訂閱消息', en: 'Subscribe' },
  });

  sidebar.messages = rule.Rule({
    id: 'layout_left_messages',
    version: 1,
    parent: sidebar.sidebar,
    template: () => i18n.sidebarShowMessages,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.sidebarShowMessagesWarning },
      atme: { type: 'boolean', template: () => i18n.sidebarShowMessagesAtMe, initial() { return true; } },
      cmt: { type: 'boolean', template: () => i18n.sidebarShowMessagesCmt, initial() { return true; } },
      like: { type: 'boolean', template: () => i18n.sidebarShowMessagesLike },
      dm: { type: 'boolean', template: () => i18n.sidebarShowMessagesDM },
      msgbox: { type: 'boolean', template: () => i18n.sidebarShowMessagesMsgBox },
      group: { type: 'boolean', template: () => i18n.sidebarShowMessagesGroup },
      dmsub: { type: 'boolean', template: () => i18n.sidebarShowMessagesDMSub },
    },
    ainit() {
      const rule = this;
      const html = {
        msg: template => template.innerHTML = '<div class="lev_Box lev_Box_noborder yawf-leftMsg"><h3 class="lev"><a href="/at/weibo?leftnav=1" class="S_txt1" node-type="item" suda-uatrack="key=V6update_leftnavigate&amp;value=message" bpfilter="message"><span class="levtxt yawf-levtxt"></span></a></h3></div>',
        atme: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_at"><a class="S_txt1" nm="mention_all" bpfilter="message" hrefextra="/at/weibo|/at/comment" nt="mention" node-type="item" href="/at/weibo?leftnav=1&amp;wvr=6&amp;nofilter=1"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        cmt: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_cmt"><a class="S_txt1" nm="cmt_all" bpfilter="message" hrefextra="/comment/inbox|/comment/outbox" node-type="item" href="/comment/inbox?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        like: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_like"><a class="S_txt1" nm="attitude" bpfilter="message" node-type="item" href="/like/inbox?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        dm: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_dm"><a class="S_txt1" nm="dm" bpfilter="message" hrefextra="/messages|/message/history" node-type="item" href="/messages?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        msgbox: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_msgbox"><a class="S_txt1" nm="msgbox_c" bpfilter="message" node-type="item" href="/notesboard?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        group: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_group"><a class="S_txt1" nm="chat_group_notice" bpfilter="message" node-type="item" href="/messages?leftnav=1&amp;wvr=6&amp;is_notice=1"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        dmsub: template => template.innerHTML = '<div class="lev" yawf-id="leftnav_msg_dmsub"><a class="S_txt1" nm="dm_group" bpfilter="message" node-type="item" href="/message/sub?leftnav=1&wvr=6"><span class="ico_block"><em class="W_ficon ficon_dot S_ficon" node-type="left_item">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
      };
      const leftNavItem = function (type, text) {
        const template = document.createElement('div');
        html[type](template);
        const textContainer = template.querySelector('.yawf-levtxt');
        textContainer.textContent = text;
        return template.firstChild;
      };
      const messages = leftNavItem('msg', i18n.sidebarShowMessagesMsg);
      ['atme', 'cmt', 'like', 'dm', 'msgbox', 'group', 'dmsub'].forEach(type => {
        const configItem = rule.ref[type];
        if (!configItem.isEnabled()) return;
        const item = leftNavItem(type, configItem.text());
        messages.appendChild(item);
      });
      observer.dom.add(function sidebarShowMessages() {
        const groupList = document.querySelector('#v6_pl_leftnav_group [node-type="groupList"]:not([yawf-message])');
        if (!groupList) return;
        let home = groupList.querySelector('.lev a[href*="/home?"]');
        while (home && home.parentNode !== groupList) home = home.parentNode;
        if (!home) return;
        const ref = home ? home.nextSibling : groupList.firstChild;
        if (!ref) return;
        groupList.setAttribute('yawf-message', '');
        ref.parentNode.insertBefore(messages, ref);
      });
    },
  });

  Object.assign(i18n, {
    sidebarMerge: { cn: '合并左右边栏|到{{side}}{{i}}', hk: '合併左右邊欄|到{{side}}{{i}}', tw: '合併左右邊欄|到{{side}}{{i}}', en: 'Merge left &amp; right column | to {{side}}{{i}}' },
    sidebarMergeToLeft: { cn: '左侧', hk: '左側', tw: '左側', en: 'left side' },
    sidebarMergeToRight: { cn: '右侧', hk: '右側', tw: '右側', en: 'right side' },
    sidebarMergeDetail: {
      cn: '开启此选项后，左栏切换页面可能会导致微音乐播放中断。',
    },
  });

  sidebar.merge = rule.Rule({
    id: 'layout_side_merge',
    version: 1,
    parent: sidebar.sidebar,
    template: () => i18n.sidebarMerge,
    ref: {
      side: {
        type: 'select',
        select: [
          { value: 'left', text: () => i18n.sidebarMergeToLeft },
          { value: 'right', text: () => i18n.sidebarMergeToRight },
        ],
        default: 'right',
      },
      i: { type: 'bubble', icon: 'warn', template: () => i18n.sidebarMergeDetail },
    },
    init() {
      this.addConfigListener(floatingAfterMerge());
      this.ref.side.addConfigListener(sidebarOn);
    },
    ainit: function mergeLeftRight() {
      // 发现页面的逻辑不一样，做处理很麻烦，所以不做处理
      if (init.page.type === 'discover') return;

      const main = document.body;
      const side = this.ref.side.getConfig() === 'right' ? 'right' : 'left';
      let left = document.querySelector('.WB_main_l');
      if (!left) { setTimeout(mergeLeftRight.bind(this), 100); return; }

      const leftPlaceholder = document.createElement('div');
      leftPlaceholder.className = 'yawf-left-fake';
      leftPlaceholder.style.display = 'none !important';
      left.before(leftPlaceholder);
      left.remove();

      // 在 body 上设置当前合并状态，供其他设置项或者其他脚本使用
      const updateMainAttr = function (side) {
        if (side && main.getAttribute('yawf-merge-left') !== side) {
          main.setAttribute('yawf-merge-left', side);
        }
        if (!side && main.hasAttribute('yawf-merge-left')) {
          main.removeAttribute('yawf-merge-left');
        }
      };

      // 将左栏的样式改为卡片效果（或改回）
      // 由于左栏样式都加在 .WB_left_nav 上，所以使用 .yawf-WB_left_nav 来躲开这些样式
      // 但相关需要保留的样式，在上面重新添加
      const fixStylish = (function () {
        let lastOnRight = false;
        // 左栏合并过去之后要改一下样式
        // 考虑到要能适应各种模板，所以就改得稍微有点过分
        // 比如说压根就没有 .WB_left_nav 这个属性了，免得颜色乱掉
        return function (onRight) {
          if (onRight == null) onRight = lastOnRight; else lastOnRight = onRight;
          const nav = left.querySelector('.WB_left_nav, .yawf-WB_left_nav');
          if (!nav) return;
          const className = onRight ? 'yawf-WB_left_nav WB_cardwrap S_bg2' : 'WB_left_nav';
          if (nav.className !== className) nav.className = className;
        };
      }());

      // 更新左侧栏位置
      const positionLeft = function () {
        const ref = document.querySelector('#v6_pl_rightmod_myinfo');
        const right = document.querySelector('.WB_main_r');
        const leftn = document.querySelector('.WB_main_l');
        if (leftn && left !== leftn) { left = leftn; }
        if (ref) {
          if (ref.nextSibling !== left) {
            ref.parentNode.insertBefore(left, ref.nextSibling);
            updateMainAttr(side);
            fixStylish(true);
          }
        } else if (right) {
          if (right.firstChild !== left) {
            right.insertBefore(left, right.firstChild);
            updateMainAttr(side);
            fixStylish(true);
          }
        } else {
          if (leftPlaceholder.previousSibling !== left) {
            leftPlaceholder.parentNode.insertBefore(left, leftPlaceholder);
            updateMainAttr();
            fixStylish(false);
          }
        }
      };

      css.append(`
[yawf-merge-left] .WB_frame .WB_main_l,
[yawf-merge-left]:not([yawf-weibo-only]) .WB_frame .yawf-WB_left_nav,
[yawf-merge-left]:not([yawf-weibo-only]) .WB_frame .WB_left_nav { width: 229px; padding: 0; float: none; }
[yawf-merge-left]:not([yawf-weibo-only]) .WB_frame { width: 840px !important; padding: 10px; background-position: -300px center; }
[yawf-merge-left] .WB_frame .yawf-WB_left_nav .lev_line fieldset, body[yawf-merge-left] .WB_frame .WB_left_nav .lev_line fieldset { padding-left: 190px; }
[yawf-merge-left] .WB_left_nav .lev a:hover, .WB_left_nav .lev_curr, .WB_left_nav .lev_curr:hover, .WB_left_nav .levmore .more { background: rgba(128, 128, 128, 0.1) !important; }
[yawf-merge-left] .WB_left_nav .lev_Box, .WB_left_nav fieldset { border-color: rgba(128, 128, 128, 0.5) !important; }
[yawf-merge-left] .WB_frame .WB_main_l #v6_pl_leftnav_msgbox.yawf-cardwrap h3 { padding: 0 16px; }
[yawf-merge-left] a.W_gotop { margin-left: 430px; }
[yawf-merge-left] .WB_webim_page #weibochat { position: static !important; }
[yawf-merge-left] .WB_webim_page .webim_contacts_mod { position: static !important; max-height: calc(100vh - 410px); }
[yawf-merge-left] .WB_webim_page .webim_contacts_bd { max-height: calc(100vh - 470px); }
[yawf-merge-left] .webim_chat_window .WB_webim_page .webim_contacts_mod,
[yawf-merge-left] .webim_chat_window .WB_webim_page .webim_contacts_bd { max-height: none; }
[yawf-merge-left="left"] .WB_frame .WB_main_r { float: left; }
[yawf-merge-left="left"] .WB_frame .WB_main_c { float: right; }

@media screen and (max-width: 1006px) {
  body[yawf-merge-left] .W_main { width: 600px !important; }
  body[yawf-merge-left]:not([yawf-weibo-only]) .WB_frame,
  body[yawf-merge-left][yawf-weibo-only] .WB_frame { width: 600px !important; }
  body[yawf-merge-left] a.W_gotop { margin-left: 310px; }
  body[yawf-merge-left="left"] .WB_main .WB_main_c { float: none; }
  body[yawf-merge-left="left"] .W_fold { right: auto; left: 0; -webkit-transform: scaleX(-1); transform: scaleX(-1); }
  body[yawf-merge-left="left"] .W_fold.W_fold_out { left: 269px; }
  body[yawf-merge-left="left"] .WB_main_r { right: auto; left: 0px; -webkit-transform: translateX(-100%) translateZ(0px); transform: translateX(-100%) translateZ(0px); }
  body[yawf-merge-left="left"] .WB_main_r.W_fold_layer { left: 269px; }
  body[yawf-merge-left="left"] .WB_main_r { direction: rtl; }
  body[yawf-merge-left="left"] .WB_main_r .WB_cardwrap { direction: ltr; }
}

`);

      // following codes are copied and modified from weibo, some one else may hold copyright
      // codes modified from http://img.t.sinajs.cn/t6/style/css/module/combination/home_A.css begin
      css.append(`
.yawf-WB_left_nav { width: 150px; }
.yawf-WB_left_nav .lev_Box { /* border-bottom-width: 1px; border-bottom-style: solid; */ }
.yawf-WB_left_nav .lev_Box_noborder { border-bottom: none; }
.yawf-WB_left_nav .lev_line fieldset { display: block; height: 22px; padding: 0 0 0 120px; zoom: 1; clear: both; border-top-width: 1px; border-top-style: solid; }
.yawf-WB_left_nav .lev_line legend { line-height: 22px; font-size: 14px; padding: 0 3px 0 4px; }
.yawf-WB_left_nav .lev_line legend .ficon_setup:hover { text-shadow: 0px 0px 4px rgba(0, 0, 0, .4); }
.yawf-WB_left_nav .lev_line_v2 fieldset { height: 11px; margin-top: 11px; }
.yawf-WB_left_nav .lev_Box h3 { display: block; height: 34px; line-height: 34px; font-size: 14px; font-weight: bold; text-decoration: none; overflow: hidden; }
.yawf-WB_left_nav .lev_Box h3.lev a { font-size: 14px; font-weight: bold; padding: 0 0 0 15px; height: 34px; line-height: 34px; }
.yawf-WB_left_nav .lev_Box h3.lev a .pic { width: 18px; height: 18px; float: left; margin: 8px 5px 0 0; }
.yawf-WB_left_nav .lev_Box h3.lev a .W_ficon { float: right; }
.yawf-WB_left_nav .lev_Box h3.S_txt1 { padding: 0 0 0 15px; }
.yawf-WB_left_nav .lev_Box h3 .ficon_add, .WB_left_nav .lev_Box h3 .ficon_setup { display: block; float: right; font-size: 14px; margin-right: 10px; }
.yawf-WB_left_nav .lev_Box h3 .ficon_add:hover, .WB_left_nav .lev_Box h3 .ficon_setup:hover { text-shadow: 0px 0px 4px rgba(0, 0, 0, .4); }
.yawf-WB_left_nav .lev a { display: block; height: 34px; line-height: 34px; font-size: 12px; padding: 0 0 0 13px; text-decoration: none; overflow: hidden; position: relative; }
.yawf-WB_left_nav .lev .lev_curr .levtxt { font-weight: bold; } 
.yawf-WB_left_nav .lev .lev_curr .ficon_dot, .WB_left_nav .lev .lev_curr .ficon_friends, .WB_left_nav .lev .lev_curr .ficon_groupwb, .WB_left_nav .lev .lev_curr .ficon_p_interest, .WB_left_nav .lev .lev_curr .ficon_p_rmd, .WB_left_nav .lev .lev_curr .ficon_p_quietfollow, .WB_left_nav .lev .lev_curr .ficon_vplus { width: 12px; letter-spacing: 18px; text-indent: -30px; } 
.yawf-WB_left_nav .lev .lev_curr .ficon_dot:after, .WB_left_nav .lev .lev_curr .ficon_friends:after, .WB_left_nav .lev .lev_curr .ficon_groupwb:after, .WB_left_nav .lev .lev_curr .ficon_p_interest:after, .WB_left_nav .lev .lev_curr .ficon_p_rmd:after, .WB_left_nav .lev .lev_curr .ficon_p_quietfollow:after, .WB_left_nav .lev .lev_curr .ficon_vplus:after { content: "B"; }
.yawf-WB_left_nav .lev .ficon_gotop { display: none; }
.yawf-WB_left_nav .lev_gotop a:hover .ficon_gotop { display: block; }
.yawf-WB_left_nav .lev_gotop a:hover .ficon_gotop:hover { text-shadow: 0px 0px 4px rgba(0, 0, 0, .4); }
.yawf-WB_left_nav .lev .levtxt { display: inline-block; max-width: 82px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
.yawf-WB_left_nav .lev .W_new_count { float: right; margin: 10px 10px 0 0; *margin: -25px 10px 0 0; background: #ed741c; color: #fff; }
.yawf-WB_left_nav .lev .W_new { float: right; margin: 12px 8px 0 0; } 
.yawf-WB_left_nav .lev .ico_block { float: left; width: 17px; text-align: center; margin: 0 3px 0 0; }
.yawf-WB_left_nav .lev .ico_block .pic { width: 16px; height: 16px; float: left; margin-top: 7px; } 
.yawf-WB_left_nav .lev .ficon_hot, .WB_left_nav .lev .ficon_video { margin: 0; font-size: 14px; }
.yawf-WB_left_nav .levmore { display: block; height: 30px; line-height: 30px; text-align: center; } 
.yawf-WB_left_nav .levmore .more { position: relative; height: 14px; line-height: 14px; padding: 2px 6px; border-radius: 3px; text-decoration: none; zoom: 1; }
.yawf-WB_left_nav .levmore .W_btn_b { margin: 8px 10px 8px 0; } 
.yawf-WB_left_nav .levmore .W_new { position: absolute; top: 0; right: -1px; }
.yawf-WB_left_nav .UI_scrollView { position: relative; } 
.yawf-WB_left_nav .W_scroll_y { right: 0; } 
`);
      // codes modified from http://img.t.sinajs.cn/t6/style/css/module/combination/home_A.css end

      // 强制点击链接时刷新页面，以解决因暴力修改造成的问题
      const forceReflush = (function () {
        let l = null;
        return function () {
          if (l === left) return; else l = left;
          left.addEventListener('click', function (e) {
            const t = e.target.closest('a'); if (!t) return;
            const href = t.href; if (!href.match(/^(?:https?:)\/\//)) return;
            e.stopPropagation(); e.preventDefault();
            util.inject(function (href) { location.assign(href); }, href);
          }, true);
        };
      }());

      observer.dom.add(function sidebarMerge() {
        positionLeft();
        fixStylish();
        forceReflush();
      });
    },
  });

  Object.assign(i18n, {
    floatingLeft: { cn: '允许首页左边栏随页面滚动始终显示', tw: '允許首頁左邊欄隨頁面滾動始終顯示', en: 'Floating left column' },
    floatingRight: { cn: '允许首页右边栏随页面滚动始终显示', tw: '允許首頁右邊欄隨頁面滾動始終顯示', en: 'Floating right column' },
  });

  sidebar.floatingLeft = rule.Rule({
    id: 'layout_left_move',
    version: 1,
    parent: sidebar.sidebar,
    template: () => i18n.floatingLeft,
    // 如果合并了左右边栏，那么左栏浮动的时候右栏不能浮动
    init() {
      this.addConfigListener(floatingAfterMerge('left'));
    },
    ainit() {
      // 禁用左栏浮动的相关代码在禁用右边栏浮动的逻辑那里统一处理
      // 如果合并了边栏，那么会因为禁用右栏浮动而同时禁用在右栏里面的左栏
      // 这时候左栏如果还要浮动，那么就要重新让他动起来
      // 这里的程序是为了让左栏再动起来的
      if (!sidebar.merge.getConfig()) return;
      css.append(`
.WB_main_r .WB_main_l { will-change: scroll-position; }
.WB_main_r[yawf-fixed] .WB_main_l { position: fixed; top: 60px !important; overflow: hidden; height: auto !important; width: 150px; }
body[yawf-merge-left] .WB_main_r[yawf-fixed] .WB_main_l { width: 229px; }
`);
      // if (layout.nav.autoHide.getConfig()) {
      //   util.css.append('.WB_main_r[yawf-fixed] .WB_main_l { top: 10px !important; }');
      // }

      // 当左侧不够长时，需要滚动条，更新滚动条的状态
      const updateScroll = function () {
        util.func.page(function () {
          const $YAWF$ = window.$YAWF$ = window.$YAWF$ || {};
          const STK = window.STK;
          if (!$YAWF$.updateLeftScroll) $YAWF$.updateLeftScroll = (function () {
            const leftNavScroll = STK.sizzle('[node-type="leftnav_scroll"]')[0];
            const leftNavScrolled = STK.ui.scrollView(leftNavScroll);
            return function () { leftNavScrolled.reset(); };
          }());
          $YAWF$.updateLeftScroll();
        });
      };

      // 限制左栏最大高度，避免超出中间区域
      const updateMaxHeight = function (left, maxHeight) {
        const none = maxHeight == null;
        const text = none ? 'none' : maxHeight + 'px';
        const srl = left.querySelector('[node-type="leftnav_scroll"]');
        if (!srl) return;
        if ((left.style.maxHeight || 'none') !== text) {
          left.style.maxHeight = text;
          if (none) srl.setAttribute('style', '');
          else {
            const lev = Array.from(srl.querySelectorAll('.lev_Box'));
            const ch = lev.map(lb => lb.clientHeight).reduce((x, y) => x + y);
            const height = Math.min(maxHeight - srl.offsetTop, ch) + 'px';
            if (srl.style.height !== height) {
              srl.style.height = height;
              srl.style.position = 'relative';
              if (srl) updateScroll();
            }
          }
        }
      };

      // 每当滚动滚动条或调整窗口大小时，更新左栏状态
      let floating = false;
      const updateLeftPosition = function updateLeftPosition() {
        const left = document.querySelector('.yawf-WB_left_nav');
        const reference = document.querySelector('.WB_main_r');
        const container = document.querySelector('#plc_main');
        if (!left || !reference) return;
        const refc = reference.getClientRects();
        if (!refc || !refc[0]) return;
        const pos = refc[0];
        if (!floating) {
          if (pos.bottom < -60) {
            floating = true;
            reference.setAttribute('yawf-fixed', '');
          }
        } else {
          if (pos.bottom + left.clientHeight > 60) {
            floating = false;
            reference.removeAttribute('yawf-fixed');
          }
        }
        if (floating) {
          const cip = container.getClientRects()[0];
          const fip = left.getClientRects()[0];
          const no_space = false; // filter.items.style.sweibo.no_weibo_space.conf;
          const maxHeightBottom = cip.bottom - fip.top + (no_space ? 0 : -10);
          const maxHeight = Math.max(Math.min(maxHeightBottom, window.innerHeight - 80), 0);
          if (cip && fip) updateMaxHeight(left, maxHeight);
        } else { updateMaxHeight(left); }
      };

      document.addEventListener('scroll', updateLeftPosition);
      window.addEventListener('resize', updateLeftPosition);
      observer.dom.add(updateLeftPosition);
    },
  });

  sidebar.floatingRight = rule.Rule({
    id: 'layout_right_move',
    version: 1,
    parent: sidebar.sidebar,
    template: () => i18n.floatingRight,
    init() {
      this.addConfigListener(floatingAfterMerge('right'));

      const merge = sidebar.merge.getConfig();
      const fleft = sidebar.floatingLeft.getConfig();
      const fright = sidebar.floatingRight.getConfig();
      // const fother = filter.items.tool.fixed.fixed_others.conf;
      const itemAttrs = ['fixed-item', 'fixed-box'];
      const containerAttrs = ['fixed-inbox', 'fixed-id'];
      const withIn = [];
      const queryString = function (classNames, attributes) {
        return classNames.map(className => (
          attributes.map(attribute => `${className} [${attribute}]`).join(',')
        )).join(',');
      };
      if (!fright) withIn.push('.WB_main_r');
      if (!fleft || merge) withIn.push('.WB_main_l');
      // if (!fother) { withIn.push('.WB_frame_b', '.WB_frame_c'); }
      if (withIn.length === 0) return;

      const removeFixed = function removeFixed() {
        const itemQuery = queryString(withIn, itemAttrs);
        const items = Array.from(document.querySelectorAll(itemQuery));
        items.forEach(function (fixed) {
          const cloned = fixed.cloneNode(true);
          itemAttrs.forEach(attr => { cloned.removeAttribute(attr); });
          fixed.replaceWith(cloned);
        });
        const containerQuery = queryString(withIn, containerAttrs);
        const containers = Array.from(document.querySelectorAll(containerQuery));
        containers.forEach(function (container) {
          const cloned = container.cloneNode(true);
          containerAttrs.forEach(function (attr) { cloned.removeAttribute(attr); });
          const parent = container.parentNode;
          const prev = parent.previousElementSibling;
          const hadWraped = parent.style.willChange && prev && prev.innerHTML === '';
          const replaceTarget = hadWraped ? parent : container;
          if (hadWraped) prev.remove();
          replaceTarget.replaceWith(cloned);
        });
      };
      observer.dom.add(removeFixed);
    },
  });

  Object.assign(i18n, {
    allSidebarOn: { cn: '统一各类页面侧栏|到{{side}}', tw: '統一各類頁面側欄|到{{side}}', en: 'Relocate side bar for all pages | to {{side}}' },
    allSidebarOnLeft: { cn: '左侧', tw: '左側', en: 'left side' },
    allSidebarOnRight: { cn: '右侧', tw: '右側', en: 'right side' },
  });

  sidebar.allSidebarOn = rule.Rule({
    id: 'layout_side_position',
    version: 1,
    parent: sidebar.sidebar,
    template: () => i18n.allSidebarOn,
    ref: {
      side: {
        type: 'select',
        select: [
          { value: 'left', text: () => i18n.allSidebarOnLeft },
          { value: 'right', text: () => i18n.allSidebarOnRight },
        ],
      },
    },
    init() {
      this.ref.side.addConfigListener(sidebarOn);
    },
    ainit() {
      const side = this.ref.side.getConfig();
      observer.dom.add(function choseSideRunner() {
        let b, c, p;
        if (side === 'left') {
          b = document.querySelector('#plc_main>.WB_frame_c:first-child+.WB_frame_b:last-child'); if (!b) return;
          p = b.parentNode;
          p.insertBefore(b, p.firstChild);
        } else if (side === 'right') {
          c = document.querySelector('#plc_main>.WB_frame_b:first-child+.WB_frame_c:last-child'); if (!c) return;
          p = c.parentNode;
          b = p.firstElementChild;
          p.appendChild(b);
        }
      });
    },
  });

}());
