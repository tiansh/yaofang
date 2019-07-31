; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};
  const css = util.css = util.css || {};

  css.add = function (css) {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.body || document.documentElement).appendChild(style);
    const remove = () => {
      if (!style.parentNode) return;
      style.parentNode.removeChild(style);
    };
    const append = css => {
      style.textContent += '\n' + css;
    };
    // 预留修改为异步添加时使用
    const ready = Promise.resolve();
    return { append, remove, ready };
  };

  const style = css.add('');
  css.append = function (css) {
    style.append('\n' + css);
  };

}());
