; (function () {

  const yawf = window.yawf = window.yawf || {};
  const browserInfo = yawf.browserInfo = {};

  const baseUrl = new URL(browser.runtime.getURL('/'));
  const browserName = {
    'moz-extension:': 'Firefox',
    'chrome-extension:': 'Chrome',
  }[baseUrl.protocol] || null;
  browserInfo.name = browserName;

  // browser.runtime.getBrowserInfo 这东西似乎在 content script 里面没法用
  // 所以还不如用 UA
  if (browserName === 'Firefox') {
    try {
      browserInfo.fullVersion = navigator.userAgent.match(/Firefox\/([\d.]+)/)[1];
      browserInfo.majorVersion = parseInt(browserInfo.fullVersion, 10);
    } catch (fxUaErr) { /* ignore */ }
  }
  if (browserName === 'Chrome') {
    try {
      browserInfo.fullVersion = navigator.userAgent.match(/Chrome\/([\d.]+)/)[1];
      browserInfo.majorVersion = parseInt(browserInfo.fullVersion, 10);
    } catch (CrUaErr) { /* ignore */ }
  }

}());
