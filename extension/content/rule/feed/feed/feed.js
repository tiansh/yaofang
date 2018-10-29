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

  const feedCollectionBall = function (action) {
    return {
      render: function () {
        const span = document.createElement('span');
        span.classList.add('yawf-config-feed-ball');
        span.classList.add('yawf-config-feed-' + action);
        return span;
      },
    };
  };

  const groups = function ({
    baseClass: Base,
    tab: tabName,
    key,
    title,
    type,
    before: { hide: beforeHide = null, show: beforeShow = null, fold: beforeFold = null } = {},
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
      { action: 'show', details: show, before: beforeShow },
      { action: 'hide', details: hide, before: beforeHide },
      { action: 'fold', details: fold, before: beforeFold },
    ].filter(item => item.details);

    actions.forEach(({ action, details: { title, priority = null }, before }) => {
      if (typeof before === 'function') before();
      group[action] = new Base({
        id: [tabName, key, action].join('.'),
        parent: group[key],
        priority: priority === null ? {
          show: 1e5,
          hide: 0,
          fold: -1e5,
        }[action] : priority,
        template: () => '{{ball}}' + title(),
        ref: {
          items: { type },
          ball: feedCollectionBall(action),
        },
        always: true,
        feedAction: action,
      });
    });

    if (fast) {
      const {
        types: [activeTypes, allTypes],
        radioGroup,
        render,
      } = fast;
      [
        ...activeTypes.map(type => ({ type, active: true })),
        ...allTypes.map(type => ({ type, active: false })),
      ].forEach(({ type, active }) => {
        const handler = {
          active,
          radioGroup,
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

  const askFast = function (selectedItems) {
    const items = [];
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
        selectedItems.forEach(originalItem => {
          const handlers = fastHandlers.get(originalItem.type) || [];
          handlers.forEach(({ active, render, rules, radioGroup }) => {
            const item = JSON.parse(JSON.stringify(originalItem));
            items.push(item);
            const li = document.createElement('li');
            const label = document.createElement('label');
            li.appendChild(label);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            item.active = checkbox.checked = active;
            checkbox.addEventListener('input', () => {
              item.active = checkbox.checked;
              if (item.active && radioGroup) {
                items.forEach(thatItem => {
                  if (thatItem === item) return;
                  if (thatItem.radioGroup !== item.radioGroup) return;
                  thatItem.setActive(false);
                });
              }
            });
            if (radioGroup) item.radioGroup = radioGroup;
            item.setActive = active => {
              item.active = checkbox.checked = active;
            };
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
        ok: function () {
          fastAddDialog.hide();
          items.forEach(async ({ active, rule: { ref: { items: ruleItem } }, type, value }) => {
            if (!active) return;
            const parseResult = await ruleItem.parseFastItem(value, type);
            parseResult.forEach(item => ruleItem.addItem(item));
          });
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
.yawf-config-feed-ball { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 1em; margin-right: 0.5em; border: 1px solid transparent; vertical-align: middle; background: var(--yawf-ball-color); box-shadow: 0 0 2px var(--yawf-ball-color); opacity: 0.8; }
.yawf-config-feed-show { --yawf-ball-color: #3ec63e; }
.yawf-config-feed-hide { --yawf-ball-color: #c63e3e; }
.yawf-config-feed-fold { --yawf-ball-color: #c6c63e; }
`);

}());
