; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const rules = yawf.rules;

  const ui = util.ui;
  const i18n = util.i18n;
  const css = util.css;

  const contextmenu = yawf.contextmenu;

  const fastHandlers = new Map();

  const groups = function ({
    baseClass: Base,
    tab: tabName,
    key,
    title,
    type,
    details: { hide = null, show = null, fold = null },
    fast = null,
  }) {
    const tab = rules[tabName];

    // 创建一个分组
    const group = tab[key] = {};
    group[key] = rule.Group({
      parent: tab[tabName],
      template: title,
    });

    // 依次创建三种类型的过滤规则
    const actions = [
      { action: 'show', details: show },
      { action: 'hide', details: hide },
      { action: 'fold', details: fold },
    ].filter(item => item.details);

    actions.forEach(({ action, details: { title, priority = null } }) => {
      group[action] = new Base({
        id: action,
        parent: group[key],
        priority: priority === null ? {
          show: 1e5,
          hide: 0,
          fold: -1e5,
        }[action] : priority,
        template: title,
        ref: { items: { type } },
        always: true,
        feedAction: action,
      });
    });

    if (fast) {
      const {
        types: [activeTypes, allTypes],
        render,
      } = fast;
      [
        ...activeTypes.map(type => ({ type, active: true })),
        ...allTypes.map(type => ({ type, active: false })),
      ].forEach(({ type, active }) => {
        const handler = {
          active,
          render,
          rules: actions.map(({ action }) => ({ action, rule: group[action] })),
        };
        if (!fastHandlers.has(type)) fastHandlers.set(type, []);
        fastHandlers.get(type).push(handler);
      });
    }
  };
  rule.groups = groups;

  Object.assign(i18n, {
    fastAddDialogTitle: {
      cn: '创建过滤规则',
      tw: '創建篩選規則',
      en: 'Create Filter Rules',
    },
    fastAddDialogDescription: {
      cn: '请选择要创建的过滤规则',
      tw: '請選擇要創建的過濾規則',
      en: 'Select Filter Rules to Create',
    },
    fastAddShow: {
      cn: '显示',
      tw: '顯示',
      en: 'show',
    },
    fastAddHide: {
      cn: '隐藏',
      tw: '隱藏',
      en: 'hide',
    },
    fastAddFold: {
      cn: '折叠',
      tw: '折疊',
      en: 'fold',
    },
  });

  const askFast = function (items) {
    const fastAddDialog = ui.dialog({
      id: 'yawf-fast-add',
      title: i18n.fastAddDialogTitle,
      render: inner => {
        const container = document.createElement('div');
        container.classList.add('yawf-fast-add-body');
        const description = document.createElement('span');
        description.textContent = i18n.fastAddDialogDescription;
        container.appendChild(description);
        const ul = document.createElement('ul');
        ul.classList.add('yawf-fast-add-list');
        container.appendChild(ul);
        items.forEach(item => {
          const handlers = fastHandlers.get(item.type) || [];
          handlers.forEach(({ active, render, rules }) => {
            const li = document.createElement('li');
            const label = document.createElement('label');
            li.appendChild(label);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            item.active = checkbox.checked = active;
            checkbox.addEventListener('input', () => {
              item.active = checkbox.checked;
            });
            label.appendChild(checkbox);
            label.appendChild(render(item));
            const select = document.createElement('select');
            rules.forEach(({ action, rule }) => {
              const option = document.createElement('option');
              option.value = action;
              option.text = i18n[{
                show: 'fastAddShow',
                hide: 'fastAddHide',
                fold: 'fastAddFold',
              }[action]];
              select.appendChild(option);
              if (action === 'hide') item.rule = rule;
            });
            li.appendChild(select);
            select.value = 'hide';
            select.addEventListener('input', () => {
              item.rule = rules.find(rule => rule.action === select.value).rule;
            });
            ul.appendChild(li);
          });
        });
        inner.appendChild(container);
      },
      button: {
        ok: async function () {
          fastAddDialog.hide();
          for (const { active, rule: { ref: { items: ruleItem } }, type, value } of items) {
            if (!active) continue;
            const parseResult = await ruleItem.parseFastItem(value, type);
            parseResult.forEach(item => ruleItem.addItem(item));
          }
        },
        cancel: function () {
          fastAddDialog.hide();
        },
      },
    });
    fastAddDialog.show();
  };

  /**
   * 用来维护所有和消息流过滤规则右键菜单
   */
  const contextMenu = function (listener) {
    contextmenu.addListener(async function (event) {
      const items = await listener(event);
      return items.map(({ title, type, value }) => ({
        title,
        onclick: () => {
          askFast([{ type, value }]);
        },
      }));
    });
  };
  rule.contextMenu = contextMenu;

  css.append(`
.yawf-fast-add-body { padding: 20px; }
.yawf-fast-add-list { padding: 20px; }
`);

}());
