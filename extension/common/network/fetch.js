; (function () {

  const yawf = window.yawf;
  const network = yawf.network;

  network.fetchText = function (url, init = {}) {
    return fetch(url, Object.assign({ credentials: 'include' }, init)).then(r => r.text());
  };

  network.fetchJson = function (url, init = {}) {
    return fetch(url, Object.assign({ credentials: 'include' }, init)).then(r => r.json());
  };

  network.fetchBlob = function (url, init = {}) {
    return fetch(url, Object.assign({ credentials: 'include' }, init)).then(r => r.blob());
  };

}());
