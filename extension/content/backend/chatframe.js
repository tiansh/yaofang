/**
 */
; (function () {

  const yawf = window.yawf = window.yawf || {};
  const chatframe = yawf.chatframe = {};
  const message = yawf.message;

  const util = yawf.util;
  const urls = util.urls;

  chatframe.chatToUid = async function (uid) {
    await message.invoke.chatToUid(uid);
  };

  chatframe.chatReady = async function () {
    await message.invoke.chatReady();
  };

}());
