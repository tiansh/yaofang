// 这个文件用于从网页中获取 $CONFIG 参数
// 网页中的 $CONFIG 参数包含脚本需要的上下文参数，如
// 当前用户 id、昵称，当前页面用户 id，当前主题等等
// 我们需要当前用户 id 才能读取用户的设置从而继续后面的工作

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const rand = new Uint8Array(64);
  crypto.getRandomValues(rand);
  const randStr = [...rand].map(value => value.toString(16).padStart(2, 0)).join('');
  const key = `yawf_${randStr}`;
  util.inject(function (key) {
    const reportResult = () => {
      Promise.resolve().then(() => {
        const $CONFIG = JSON.stringify(window.$CONFIG);
        window.postMessage({ message: { key, $CONFIG }, direction: 'yawf' }, '*');
      });
    };
    Object.defineProperty(window, '$CONFIG', {
      configurable: true,
      get: () => (void 0),
      set: value => {
        delete window.$CONFIG;
        window.$CONFIG = value;
        reportResult();
      },
    });
    const onload = () => {
      window.removeEventListener('load', onload);
      reportResult();
    };
    window.addEventListener('load', onload);
  }, key);

  const configReady = function (event) {
    if (event.source !== window) return;
    if (!event.data) return;
    if (event.data.direction !== 'yawf') return;
    if (event.data.message.key !== key) return;
    const $CONFIG = JSON.parse(event.data.message.$CONFIG);
    window.removeEventListener('message', configReady);
    if ($CONFIG) init.ready($CONFIG);
    else init.deinit();
  };
  window.addEventListener('message', configReady);

}());
