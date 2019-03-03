; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const download = yawf.download = {};
  const message = yawf.message;

  /**
   * @param {Blob} blob
   * @returns {string}
   */
  const blobToDataUrl = async function (blob) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(reader.result);
      });
      reader.readAsDataURL(blob);
    });
  };

  /**
   * @param {{ blob: Blob, filename: string }}
   */
  download.file = async function ({ blob, filename }) {
    const dataUrl = await blobToDataUrl(blob);
    await message.invoke.downloadFile({ url: dataUrl, filename });
  };


}());
