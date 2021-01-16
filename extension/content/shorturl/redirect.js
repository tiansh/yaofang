; (function () {

  // 脚本版需要这行，所以这里姑且加上
  if (location.host !== 't.cn') return;

  const yawf = window.yawf;
  const config = yawf.config;

  /** @type {Promise} */
  const configPromise = config.init();

  const hideAll = document.createElement('style');
  hideAll.textContent = `
body { display: none; }
html { background: #f9f9fa; }
@media (prefers-color-scheme: dark) { html { background: #2a2a2e; } }
`;
  document.documentElement.appendChild(hideAll);

  const fixUrl = function (url) {
    // 显示的字符编码是错的
    // 原本 UTF-8 编码的网址用 Latin-1 展示的
    let fixEncodingUrl = url;
    try {
      const codePoints = [...url].map(x => x.charCodeAt());
      if (codePoints.every(code => code < 256)) {
        fixEncodingUrl = new TextDecoder().decode(new Uint8Array(codePoints));
      }
    } catch (e) {
      fixEncodingUrl = url;
    }
    if (!/https?:\/\/.*/i.test(fixEncodingUrl)) return null;
    return fixEncodingUrl;
  };

  const onLoad = function () {
    configPromise.then(() => {
      const useRedirect = config.global.key('short_url_wo_confirm').get();
      if (!useRedirect) return false;
      let url = [
        () => document.querySelector('.open-url a').href,
        () => document.querySelector('.link').textContent.trim(),
        () => document.querySelector('.url_view_code').textContent.trim(),
      ].reduce((url, getter) => {
        if (url) return url;
        try {
          return fixUrl(getter());
        } catch (e) { return null; }
      }, null);
      if (!url) return false;
      location.replace(url);
      return true;
    }).then(r => r, () => false).then(redirect => {
      if (!redirect) hideAll.remove();
    });
  };

  if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
    setTimeout(onLoad, 0);
  } else {
    document.addEventListener('DOMContentLoaded', onLoad);
  }

}());
