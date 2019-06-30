; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const css = util.css;

  (async function avatarShape() {
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

  (async function () {
    const userConfig = await init.userConfig;
    const hideApprove = userConfig.key('clean_icons_approve').get();
    const hideApproveCo = userConfig.key('clean_icons_approve_co').get();
    const hideClub = userConfig.key('clean_icons_club').get();
    const hideVGirl = userConfig.key('clean_icons_v_girl').get();
    // 其实有红色和橙色两种，不过他们 src 末尾一样
    if (hideApprove) css.append('.avator-box .m-icon img[src$="gg=="] { display: none; }');
    if (hideApproveCo) css.append('.avator-box .m-icon img[src$="QmCC"] { display: none; }');
    if (hideClub) css.append('.avator-box .m-icon img[src$="CYII"] { display: none; }');
    if (hideVGirl) css.append('.avator-box .m-icon img[src$="YII="] { display: none; }');
  }());

}());
