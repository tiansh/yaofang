; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  util.inject = function (func, ...args) {
    const executeScript = `void(${func}(${args.map(value => JSON.stringify(value))}));`;
    const script = document.createElement('script');
    script.textContent = executeScript;
    const target = document.head || document.body || document.documentElement || document.getElementsByTagName('*')[0];
    return new Promise(resolve => {
      script.addEventListener('load', () => {
        resolve();
        script.parentElement.removeChild(script);
      });
      target.appendChild(script);
    });
  };

}());
