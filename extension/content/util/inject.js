; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  util.inject = function (func, ...args) {
    const executeScript = `void(${func}(${args.map(value => JSON.stringify(value))}));`;
    if (browser.runtime.getURL('/').startsWith('moz-extension:')) {
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1267027
      return Promise.resolve().then(() => (
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Using_eval()_in_content_scripts
        window.eval(executeScript)  // eslint-disable-line
      ));
    } else {
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
    }
  };

}());
