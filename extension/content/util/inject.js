; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  util.inject = function (func, ...args) {
    const executeScript = `void(${func}(${args.map(value => JSON.stringify(value))}));`;
    const script = document.createElement('script');
    script.textContent = executeScript;
    const target = document.head || document.body || document.documentElement;
    return new Promise(resolve => {
      script.addEventListener('load', () => {
        resolve();
        // script.parentElement.removeChild(script);
      });
      if (target) target.appendChild(script);
      else setTimeout(function injectScript() {
        const target = document.head || document.body || document.documentElement;
        if (!target) setTimeout(injectScript, 10);
        else target.appendChild(script);
      }, 10);
    });
  };

}());
