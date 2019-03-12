; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};
  const urls = util.urls = util.urls || {};

  /**
   * @param {Blob} blob
   * @returns {string}
   */
  urls.blobToDataUrl = function (blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(reader.result);
      });
      reader.readAsDataURL(blob);
    });
  };

}());
