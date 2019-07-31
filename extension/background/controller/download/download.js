/**
 * 下载一个文件
 */
; (function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const downloadByUrl = async function ({ url, filename }) {
    const downloadId = await browser.downloads.download({ url, filename });
    return new Promise(async resolve => {
      const downloadFinish = function () {
        browser.downloads.onChanged.removeListener(downloadOnChanged);
        resolve();
      };
      const downloadOnChanged = function ({ id, state }) {
        if (id !== downloadId) return;
        if (!state || state.current !== 'complete') return;
        downloadFinish();
      };
      browser.downloads.onChanged.addListener(downloadOnChanged);
      const [downloadItem] = await browser.downloads.search({ id: downloadId });
      if (downloadItem.state === 'complete') downloadFinish();
    });
  };

  /**
   * @param {{ url: string, filename: string }}
   */
  const downloadFile = async function downloadFile({ url, filename }) {
    if (url.startsWith('data:')) {
      const blob = await fetch(url).then(resp => resp.blob());
      const blobUrl = URL.createObjectURL(blob);
      await downloadByUrl({ url: blobUrl, filename });
      URL.revokeObjectURL(blobUrl);
    } else {
      await downloadByUrl({ url, filename });
    }
  };
  message.export(downloadFile);

  /**
   * @param {{ url: string, filename: string }[]}
   */
  const downloadFiles = async function downloadFiles(files) {
    for (let i = 0, l = files.length; i < l; i++) {
      await downloadFile(files[i]);
    }
  };
  message.export(downloadFiles);


}());
