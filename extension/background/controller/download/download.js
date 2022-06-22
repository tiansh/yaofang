/**
 * 下载一个文件
 */
; (function () {

  const browser = window.weBrowser;
  const yawf = window.yawf;
  const message = yawf.message;

  const downloadByUrl = async function ({ url, filename, referrer }) {
    const headers = [];
    if (referrer) headers.push({ name: 'Referer', value: referrer });
    const downloadId = await browser.downloads.download({ url, filename, headers });
    return new Promise(async resolve => {
      const downloadFinish = function (error) {
        browser.downloads.onChanged.removeListener(downloadOnChanged);
        resolve({ id: downloadId, success: !error });
      };
      const stateUpdate = function (state) {
        if (!state || state === 'in_progress') return;
        if (state === 'complete') downloadFinish();
        else downloadFinish(new Error('Download Failed'));
      };
      const downloadOnChanged = function ({ id, state }) {
        if (id !== downloadId) return;
        if (state) stateUpdate(state.current);
      };
      browser.downloads.onChanged.addListener(downloadOnChanged);
      const downloadItemPromise = browser.downloads.search({ id: downloadId });
      downloadItemPromise.then(([downloadItem]) => {
        stateUpdate(downloadItem.state);
      }, error => downloadFinish(new Error(error)));
    });
  };

  /**
   * @param {{ url: string, filename: string }}
   */
  const downloadFile = async function downloadFile({ url, filename, referrer = '' }) {
    if (url.startsWith('data:')) {
      const blob = await fetch(url).then(resp => resp.blob());
      const blobUrl = URL.createObjectURL(blob);
      const result = await downloadByUrl({ url: blobUrl, filename });
      URL.revokeObjectURL(blobUrl);
      return result;
    } else {
      return await downloadByUrl({ url, filename, referrer });
    }
  };
  message.export(downloadFile);

  /**
   * @param {{ url: string, filename: string }[]}
   */
  const downloadFiles = async function downloadFiles(files) {
    const results = [];
    for (let i = 0, l = files.length; i < l; i++) {
      const result = await downloadFile(files[i]);
      results.push(result);
    }
    return results;
  };
  message.export(downloadFiles);

  const downloadShow = async function downloadShow(id) {
    await browser.downloads.show(id);
  };
  message.export(downloadShow);

}());

