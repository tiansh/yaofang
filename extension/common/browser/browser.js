; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const browserInfo = yawf.browserInfo = {};

  const baseUrl = new URL(browser.runtime.getURL('/'));
  const browserName = {
    'moz-extension:': 'Firefox',
    'chrome-extension:': 'Chrome',
  }[baseUrl.protocol] || null;
  browserInfo.name = browserName;

  if (browserName === 'Firefox') {
    try {
      browserInfo.fullVersion = navigator.userAgent.match(/Firefox\/([\d.]+)/)[1];
      browserInfo.majorVersion = parseInt(browserInfo.fullVersion, 10);
    } catch (fxUaErr) { /* ignore */ }
    try {
      browserInfo.runtime.getBrowserInfo().then(info => {
        if (!info || !info.version) return;
        browserInfo.fullVersion = info.version;
        browserInfo.majorVersion = parseInt(info.version, 10);
      });
    } catch (FxApiErr) { /* ignore */ }
  }
  if (browserName === 'Chrome') {
    try {
      browserInfo.fullVersion = navigator.userAgent.match(/Chrome\/([\d.]+)/)[1];
      browserInfo.majorVersion = parseInt(browserInfo.fullVersion, 10);
    } catch (CrUaErr) { /* ignore */ }
  }

}());
