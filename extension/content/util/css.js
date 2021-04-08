; (function () {

  const yawf = window.yawf = window.yawf ?? {};
  const util = yawf.util = yawf.util ?? {};
  const css = util.css = util.css ?? {};

  css.add = function (css) {
    const target = document.head || document.body || document.documentElement;
    const style = document.createElement('style');
    style.textContent = css;
    let removed = false;
    let ready = Promise.resolve();
    if (target) target.appendChild(style);
    else {
      ready = new Promise(resolve => {
        setTimeout(function addStyle() {
          if (removed) {
            resolve();
            return;
          }
          const target = document.head || document.body || document.documentElement;
          if (!target) setTimeout(addStyle, 10);
          else {
            target.appendChild(style);
            resolve();
          }
        }, 10);
      });
    }
    const remove = () => {
      if (!style.parentNode) return;
      style.parentNode.removeChild(style);
      removed = true;
    };
    const append = css => {
      style.textContent += '\n' + css;
    };
    return { append, remove, ready };
  };

  const style = css.add('');
  css.append = function (css) {
    style.append('\n' + css);
  };

}());
