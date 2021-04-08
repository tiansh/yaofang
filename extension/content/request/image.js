; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;

  const request = yawf.request = yawf.request ?? {};

  const getImage = function (url) {
    util.debug('fetch url %s', url);
    return network.fetchBlob(url, { credentials: 'omit' });
  };
  request.getImage = getImage;

}());
