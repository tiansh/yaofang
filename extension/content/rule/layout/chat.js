; (function () {
  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;

  const chat = layout.chat = {};

  i18n.chatToolGroupTitle = {
    cn: '聊天',
    en: 'Chat',
  };

  chat.chat = rule.Group({
    parent: layout.layout,
    template: () => i18n.chatToolGroupTitle,
  });

  i18n.chatPageDisableUnloadPrompt = {
    cn: '关闭聊天页面时无需二次确认',
    tw: '關閉聊天頁面時無需二次確認',
    en: 'Prevent promopting when close chat page',
  };

  chat.chatPageDisableUnloadPrompt = rule.Rule({
    id: 'chat_page_disable_unload_prompt',
    version: 57,
    parent: chat.chat,
    template: () => i18n.chatPageDisableUnloadPrompt,
    // 实现在 /content/chat/rule.js
  });

}());
