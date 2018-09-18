; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const tool = yawf.rules.tool;

  const i18n = util.i18n;
  const css = util.css;

  const sidebar = tool.sidebar = {};

  i18n.sideBarToolGroupTitle = {
    cn: '边栏',
    tw: '邊欄',
    en: 'Sidebar',
  };

  sidebar.sidebar = rule.Group({
    parent: tool.tool,
    template: () => i18n.sideBarToolGroupTitle,
  });

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
    id: 'left_nav_msgs',
    parent: sidebar.sidebar,
    template: () => i18n.sidebarShowMessages,
    ref: {
      i: {
        type: 'bubble',
        icon: 'warn',
        template: () => i18n.sidebarShowMessagesWarning,
      },
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
        msg: '<div class="lev_Box lev_Box_noborder yawf-leftMsg"><h3 class="lev"><a href="/at/weibo?leftnav=1" class="S_txt1" node-type="item" suda-uatrack="key=V6update_leftnavigate&amp;value=message" bpfilter="message"><span class="levtxt yawf-levtxt"></span></a></h3></div>',
        atme: '<div class="lev" yawf-id="leftnav_msg_at"><a class="S_txt1" nm="mention_all" bpfilter="message" hrefextra="/at/weibo|/at/comment" nt="mention" node-type="item" href="/at/weibo?leftnav=1&amp;wvr=6&amp;nofilter=1"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        cmt: '<div class="lev" yawf-id="leftnav_msg_cmt"><a class="S_txt1" nm="cmt_all" bpfilter="message" hrefextra="/comment/inbox|/comment/outbox" node-type="item" href="/comment/inbox?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        like: '<div class="lev" yawf-id="leftnav_msg_like"><a class="S_txt1" nm="attitude" bpfilter="message" node-type="item" href="/like/inbox?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        dm: '<div class="lev" yawf-id="leftnav_msg_dm"><a class="S_txt1" nm="dm" bpfilter="message" hrefextra="/messages|/message/history" node-type="item" href="/messages?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        msgbox: '<div class="lev" yawf-id="leftnav_msg_msgbox"><a class="S_txt1" nm="msgbox_c" bpfilter="message" node-type="item" href="/notesboard?leftnav=1&amp;wvr=6"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        group: '<div class="lev" yawf-id="leftnav_msg_group"><a class="S_txt1" nm="chat_group_notice" bpfilter="message" node-type="item" href="/messages?leftnav=1&amp;wvr=6&amp;is_notice=1"><span class="ico_block"><em node-type="left_item" class="W_ficon ficon_dot S_ficon">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
        dmsub: '<div class="lev" yawf-id="leftnav_msg_dmsub"><a class="S_txt1" nm="dm_group" bpfilter="message" node-type="item" href="/message/sub?leftnav=1&wvr=6"><span class="ico_block"><em class="W_ficon ficon_dot S_ficon" node-type="left_item">D</em></span><span class="levtxt yawf-levtxt"></span></a></div>',
      };
      const leftNavItem = function (type, text) {
        const template = document.createElement('div');
        template.innerHTML = html[type];
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
      observer.add(function sidebarShowMessages() {
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


}());
