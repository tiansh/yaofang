; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const css = util.css;

  ; (async function avatarShape() {
    const userConfig = await init.userConfig;
    const isEnabled = userConfig.key('layout_avatar_shape').get();
    if (!isEnabled) return;
    const shape = userConfig.key('layout_avatar_shape.shape').get();
    if (shape === 'square') {
      // 是的，他们就是有的拼成了 avatar 有的拼成了 avator ；顺便一说，前面一个拼得对
      css.append(`
#app .avatar, #app .avator { border-radius: 0; }
`);
    }
  }());

  const disableUnloadPrompt = function () {
    util.inject(function disableBeforeUnload() {
      if (!window.onbeforeunload) {
        setTimeout(disableBeforeUnload, 100);
      } else {
        window.onbeforeunload = null;
        window.onunload = null;
      }
    });
  };

  ; (async function () {
    const userConfig = await init.userConfig;

    const rules = [{
      key: 'clean_icons_approve',
      ainit: () => css.append('.avator-box .m-icon img[src$="gg=="] { display: none; }'),
    }, {
      key: 'clean_icons_approve_co',
      ainit: () => css.append('.avator-box .m-icon img[src$="QmCC"] { display: none; }'),
    }, {
      key: 'clean_icons_club',
      ainit: () => css.append('.avator-box .m-icon img[src$="CYII"] { display: none; }'),
    }, {
      key: 'clean_icons_v_girl',
      ainit: () => css.append('.avator-box .m-icon img[src$="YII="] { display: none; }'),
    }, {
      key: 'clean_icons_bigfun',
      ainit: () => css.append('#app .icon-area > i.tf { display: none; }'),
    }];
    rules.forEach(({ key, ainit }) => {
      const isEnabled = userConfig.key(key).get();
      if (isEnabled) ainit();
    });

    if (self !== top || userConfig.key('chat_page_disable_unload_prompt').get()) {
      disableUnloadPrompt();
    }

  }());

}());
