; (function () {

  const yawf = window.yawf;
  const network = yawf.network;

  network.fetchText = function (url) {
    return fetch(url, { credentials: 'include' }).then(r => r.text());
  };

  network.fetchJson = function (url) {
    return fetch(url, { credentials: 'include' }).then(r => r.json());
  };

}());
