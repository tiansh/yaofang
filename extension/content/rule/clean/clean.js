; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const init = yawf.init;

  const i18n = util.i18n;
  const css = util.css;
  const priority = util.priority;

  i18n.cleanTabTitle = {
    cn: '版面清理',
    en: 'Clean Up',
  };

  const clean = yawf.rules.clean = {};
  clean.clean = rule.Tab({
    template: () => i18n.cleanTabTitle,
  });

  let lastCleanGroup = null;
  clean.CleanGroup = function (id, template) {
    const group = rule.Group({
      id,
      parent: clean.clean,
      template,
      render(...args) {
        const node = super.render(...args);
        node.classList.add('yawf-clean-group');
        return node;
      },
    });
    clean[id] = { [id]: group };
    lastCleanGroup = id;
    return group;
  };

  clean.CleanRule = function (id, template, version, action, details) {
    clean[lastCleanGroup][id] = rule.Rule(Object.assign({
      id: lastCleanGroup + '_' + id,
      template,
      parent: clean[lastCleanGroup][lastCleanGroup],
      version,
    }, typeof action === 'string' ? {
      acss: action,
    } : typeof action === 'function' ? {
      ainit: action,
    } : typeof action === 'object' ? action : {}, details));
  };

  i18n.cleanConfigColumnCount = {
    cn: '3',
    en: '2',
  };

  init.onReady(() => {
    css.append(`
.yawf-clean-group + .yawf-config-group-items { display: grid; grid-template-columns: repeat(${i18n.cleanConfigColumnCount}, 1fr); grid-gap: 5px 10px; margin: 5px 20px; }
.yawf-clean-group + .yawf-config-group-items > .yawf-config-rule { margin: 0; }
`);
  }, { priority: priority.DEFAULT });

}());
