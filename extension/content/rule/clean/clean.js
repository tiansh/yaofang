; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const init = yawf.init;
  const observer = yawf.observer;

  const i18n = util.i18n;
  const css = util.css;
  const priority = util.priority;

  i18n.cleanTabTitle = {
    cn: '界面清理',
    tw: '介面清理',
    en: 'Clean Up',
  };
  i18n.cleanTabSelectAll = {
    cn: '全选本组',
    tw: '全選本組',
    en: 'Select Group',
  };

  const clean = yawf.rules.clean = {};
  clean.clean = rule.Tab({
    template: () => i18n.cleanTabTitle,
    pagemenu: true,
  });

  const selectAllButton = id => {
    const button = document.createElement('a');
    button.className = 'W_btn_b yawf-clean-group-all';
    const content = document.createElement('span');
    content.textContent = i18n.cleanTabSelectAll;
    button.appendChild(content);
    button.addEventListener('click', event => {
      if (!event.isTrusted) return;
      const group = clean[id];
      Object.keys(group).forEach(key => {
        const item = group[key];
        if (item instanceof rule.class.Rule) {
          if (item.setConfig) item.setConfig(true);
        }
      });
    });
    return button;
  };

  let lastCleanGroup = null;
  clean.CleanGroup = function (id, template) {
    const group = rule.Group({
      id,
      parent: clean.clean,
      template,
      render(...args) {
        const node = super.render(...args);
        node.classList.add('yawf-clean-group');
        const button = selectAllButton(id);
        node.appendChild(button);
        return node;
      },
    });
    clean[id] = { [id]: group };
    lastCleanGroup = id;
    return group;
  };

  clean.CleanRule = function (id, template, version, action, details) {
    clean[lastCleanGroup][id] = rule.Rule(Object.assign({
      id: 'clean_' + lastCleanGroup + '_' + id,
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
    cn: 3,
    en: 2,
  };

  init.onReady(() => {
    css.append(`
.yawf-clean-group + .yawf-config-group-items { display: grid; grid-template-columns: repeat(${i18n.cleanConfigColumnCount}, 1fr); grid-gap: 5px 10px; margin: 5px 20px; }
.yawf-clean-group + .yawf-config-group-items > .yawf-config-rule { margin: 0; }
.yawf-clean-group-all { float: right; font-weight: normal; cursor: pointer; }
.yawf-whatsnew-dialog .yawf-clean-group-all, .yawf-config-layer-search .yawf-clean-group-all { display: none; }
`);
  }, { priority: priority.DEFAULT });


  clean.tagElements = function (name, selector, identifiers) {
    const tagElements = function tagElements() {
      const elements = Array.from(document.querySelectorAll(selector));
      if (!elements.length) return;
      elements.forEach(function (element) {
        element.setAttribute('yawf-id', '');
        const matched = Object.keys(identifiers).find(selector => element.querySelector(selector));
        if (matched) element.setAttribute('yawf-id', identifiers[matched]);
      });
    };
    Object.defineProperty(tagElements, 'name', { value: `tagElements${name}` });
    observer.dom.add(tagElements);
  };

}());
