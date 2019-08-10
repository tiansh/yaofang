; (function () {

  const yawf = window.yawf = window.yawf || {};
  const env = yawf.env = {};

  env.name = 'WebExtension';

  const config = env.config = {};

  config.stkWrapSupported = true;
  config.stkInfoSupported = true;
  config.contextMenuSupported = true;
  config.requestBlockingSupported = true;
  config.chatInPageSupported = true;

  config.externalMenuSupported = false;

  config.consolePrefix = 'Yaofang';

  config.contextMenuKey = 'Y';

}());
