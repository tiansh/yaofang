; (function () {

  const yawf = window.yawf = window.yawf ?? {};
  const env = yawf.env = {};

  env.name = 'WebExtension';

  const config = env.config = {};

  config.contextMenuSupported = true;
  config.requestBlockingSupported = true;
  config.chatInPageSupported = true;

  config.externalMenuSupported = true;

  config.consolePrefix = 'Yaofang';

  config.contextMenuKey = 'Y';

}());
