/**
 * 这个文件用于从网页中获取 $CONFIG 参数
 * 网页中的 $CONFIG 参数包含脚本需要的上下文参数，如
 * 当前用户 id、昵称，当前页面用户 id，当前主题等等
 * 我们需要当前用户 id 才能读取用户的设置从而继续后面的工作
 */

; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const strings = util.strings;

  const randStr = strings.randKey();
  const key = `yawf_${randStr}`;
  util.inject(function (key) {
    let lastReport = null;
    const reportResult = async value => {
      lastReport = lastReport ? lastReport.then(Promise.resolve()) : Promise.resolve();
      await lastReport;
      const event = new CustomEvent(key, {
        detail: { $CONFIG: JSON.stringify(value) },
      });
      window.dispatchEvent(event);
    };
    if ('$CONFIG' in window) {
      location.reload();
      return;
    }
    let $CONFIG = void 0;
    let proxied = void 0;
    Object.defineProperty(window, '$CONFIG', {
      configurable: true,
      enumerable: false,
      get() { return proxied; },
      set(value) {
        Object.defineProperty(window, '$CONFIG', { enumerable: true });
        $CONFIG = value;
        proxied = new Proxy($CONFIG, {
          set: function (self, property, value) {
            self[property] = value;
            reportResult($CONFIG);
            return true;
          },
        });
        reportResult($CONFIG);
      },
    });
    const onload = () => {
      window.removeEventListener('load', onload);
      reportResult();
    };
    window.addEventListener('load', onload);
  }, key);

  let lastConfig = void 0;
  window.addEventListener(key, function (event) {
    event.stopPropagation();
    if (!event.detail.$CONFIG) return;
    const $CONFIG = JSON.parse(event.detail.$CONFIG);
    if (event.detail.$CONFIG === lastConfig) return;
    lastConfig = event.detail.$CONFIG;
    init.configChange($CONFIG);
  }, true);

}());

