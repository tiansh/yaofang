; (function () {

  const yawf = window.yawf = window.yawf || {};
  const env = yawf.env = {};

  env.name = 'WebExtension';

  const config = env.config = {};

  config.stkWrapSupported = true;
  config.stkInfoSupported = true;
  config.contextMenuSupported = true;
  config.requestBlockingSupported = false;
  config.chatInPageSupported = true;

  config.consolePrefix = 'Yaofang';

  config.contextMenuKey = 'Y';

}());
