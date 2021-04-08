; (function () {

  const yawf = window.yawf = window.yawf ?? {};

  const message = yawf.message;

  const fontList = yawf.fontList = {};

  fontList.get = function () {
    return message.invoke.getSupportedFontList();
  };

}());

