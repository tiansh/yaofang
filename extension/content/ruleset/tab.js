; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const ui = util.ui;
  const i18n = util.i18n;

  const ruleset = yawf.ruleset = yawf.ruleset || {};

  const tabs = ruleset.tabs = [];

  const tabProto = {};

  ruleset.Tab = function (tab) {
    Object.setPrototypeOf(tab, tabProto);
    tabs.push(tab);
    return tab;
  };

}());