; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  util.inject = function (func, ...args) {
    const script = `void(${func}(${args.map(value => JSON.stringify(value))}));`;
    return Promise.resolve().then(() => (
      // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Using_eval()_in_content_scripts
      window.eval(script)  // eslint-disable-line
    ));
  };

}());
