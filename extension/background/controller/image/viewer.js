/**
 * 打开查看图片页面
 */
; (function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const showImageViewer = function showImageViewer({ images, current, background = false }) {
    const sender = this;
    const url = new URL(browser.runtime.getURL('/external/imageviewer/index.html'));
    images.forEach(image => url.searchParams.append('i', image));
    url.hash = current;
    browser.tabs.create({
      index: sender.tab.index,
      url: url.href,
      active: !background,
      openerTabId: sender.tab.id,
    });
  };

  message.export(showImageViewer);

}());
