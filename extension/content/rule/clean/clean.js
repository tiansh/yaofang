; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.cleanTabTitle = {
    cn: '版面清理',
    en: 'Clean Up',
  };

  const clean = yawf.rules.clean = {};
  clean.clean = rule.Tab({
    id: 'clean',
    template: () => i18n.cleanTabTitle,
  });

  let lastCleanGroup = null;
  clean.CleanGroup = function (id, template) {
    const group = rule.Group({
      id,
      parent: clean.clean,
      template,
    });
    clean[id] = { [id]: group };
    lastCleanGroup = id;
    return group;
  };

  clean.CleanRule = function (id, template, version, acss, details) {
    clean[lastCleanGroup][id] = rule.Rule(Object.assign({
      id,
      template,
      parent: clean[lastCleanGroup][lastCleanGroup],
      version,
      acss,
    }, details));
  };

}());
