; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const ui = util.ui;
  const i18n = util.i18n;

  const ruleset = yawf.ruleset = yawf.ruleset || {};

  const rules = ruleset.rules = [];

  const ruleProto = {
  };

  ruleset.Rule = function (rule) {
    Object.setPrototypeOf(rule, ruleProto);
    rules.push(rule);
  };

}());