; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const init = yawf.init;
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
    before: { hide: beforeHide = null, show: beforeShow = null } = {},
    details: { hide = null, show = null },
    fast = null,
    version,
  }) {
    const tab = rules[tabName];

    // 创建一个分组
    const group = tab[key] = {};
    group[key] = rule.Group({
      parent: tab[tabName],
      template: title,
    });

    const actions = [
      { action: 'show', details: show, before: beforeShow },
    ].filter(item => item.details);

    actions.forEach(({ action, details: { title, priority = null }, before }) => {
      if (typeof before === 'function') before();
      group[action] = new Base({
        id: ['filter', tabName, key, action].join('_'),
        version,
        parent: group[key],
        priority: priority === null ? {
          show: 1e5,
          hide: 0,
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

  css.append(`
.yawf-config-feed-ball { display: inline-block; width: 0.8em; height: 0.8em; border-radius: 1em; margin-right: 0.5em; border: 1px solid transparent; vertical-align: middle; background: var(--yawf-ball-color); box-shadow: 0 0 2px var(--yawf-ball-color); opacity: 0.8; }
.yawf-config-feed-show { --yawf-ball-color: #3ec63e; }
.yawf-config-feed-hide { --yawf-ball-color: #c63e3e; }
`);

  // 后面的都还没支持新版
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
  });

  // 显示一个用于快速创建规则的对话框
  const askFast = function (selectedItems) {
    const items = [];
    const render = function (inner) {
      const container = document.createElement('div');
      container.classList.add('yawf-fast-add-body');
      const description = document.createElement('span');
      description.textContent = i18n.fastAddDialogDescription;
      container.appendChild(description);
      const ul = document.createElement('ul');
      ul.classList.add('yawf-fast-add-list');
      container.appendChild(ul);
      selectedItems.forEach(originalItem => {
        const handlers = fastHandlers.get(originalItem.type) ?? [];
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
            }[action]];
            select.appendChild(option);
          });
          li.appendChild(select);
          select.value = 'hide';
          item.getRule = () => rules.find(rule => rule.action === select.value).rule;
          ul.appendChild(li);
        });
      });
      container.addEventListener('input', event => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) return;
        Array.from(container.querySelectorAll('select')).forEach(select => {
          if (select.value === target.value) return;
          const targetOption = [...select.options].find(option => option.value === target.value);
          const setValue = targetOption ? targetOption.value : 'hide';
          select.value = setValue;
        });
      });
      inner.appendChild(container);
    };
    const fastAddDialog = ui.dialog({
      id: 'yawf-fast-add',
      title: i18n.fastAddDialogTitle,
      render,
      button: {
        ok: function () {
          fastAddDialog.hide();
          items.forEach(async ({ active, getRule, type, value }) => {
            if (!active) return;
            const { ref: { items: ruleItem } } = getRule();
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
   * 维护用于快速创建规则的对话框
   * @type {Array<(target: Element | Selection) => Array<{ title: string, type: string, value: any }>>}
   */
  const fastListeners = [];
  rule.addFastListener = function (listener) {
    fastListeners.push(listener);
  };
  const runFastListeners = async function (target) {
    const responses = await Promise.all(fastListeners.map(listener => listener(target)));
    return responses.reduce((a, b) => a.concat(b), []);
  };

  /**
   * 用来维护所有和消息流过滤规则右键菜单
   */
  ; (async function () {

    if (!env.config.contextMenuSupported) return;

    contextmenu.addListener(async function (event) {
      if (init.page.type() === 'search') return null;
      const selection = window.getSelection();
      const target = event.target;
      let useSelection = true;
      if (!(selection + '')) useSelection = false;
      for (let i = 0; useSelection && i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const isChild = [range.startContainer, range.endContainer].every(e => {
          for (; e === target; e = e.parentNode) if (!e) return false;
          return true;
        });
        if (!isChild) useSelection = false;
      }
      const items = await runFastListeners(useSelection ? selection : target);
      return items.map(({ title, type, value }) => ({
        title,
        onclick: () => {
          askFast([{ type, value }]);
        },
      }));
    });

  }());

  /**
   * 拖拽相关
   */
  ; (async function () {

    Object.assign(i18n, {
      dropAreaTitle: {
        cn: '拖放至此\n快速创建过滤规则',
        tw: '拖放至此\n快速創建篩選規則',
        en: 'Drop Here\nCreate Filter Rules',
      },
      dropAreaContent: {
        cn: '您可以将文本、帐号名、头像、话题、来源等拖放至此处以创建过滤规则',
        tw: '您可以將文本、帳號名、頭像、話題、來源等拖放至此處以創建過濾規則',
        en: 'by dragging text, account names, avatars, topics, sources, etc.',
      },
    });

    const dragItems = [];
    const dropArea = document.createElement('div');
    let dragIndex = 0, inArea = false;
    const showDropArea = function () {
      dragIndex++;
      if (!dropArea) return;
      dropArea.classList.add('yawf-drag');
      if (dropArea.parentNode) dropArea.parentNode.classList.add('yawf-drop-area-active');
    };
    const hideDropArea = function () {
      dragIndex++;
      inArea = false;
      if (!dropArea) return;
      dropArea.classList.remove('yawf-drag', 'yawf-drag-in');
      if (dropArea.parentNode) dropArea.parentNode.classList.remove('yawf-drop-area-active');
    };
    const enterDropArea = function () {
      inArea = true;
      if (!dropArea) return;
      dropArea.classList.add('yawf-drag-in');
    };
    const leaveDropArea = function () {
      inArea = false;
      if (!dropArea) return;
      dropArea.classList.remove('yawf-drag-in');
    };

    const dragStartHandler = async function (event) {
      const selection = window.getSelection();
      const target = event.target;
      const currentDragIndex = ++dragIndex;
      let useSelection = false;
      if (target instanceof Text) useSelection = true;
      const items = await runFastListeners(useSelection ? selection : target);
      if (!items.length) return;
      if (currentDragIndex !== dragIndex) return;
      dragItems.splice(0);
      dragItems.push(...items);
      showDropArea();
    };
    const dragEndHandler = function () {
      dragItems.splice(0);
      hideDropArea();
    };
    let dragEnterCount = 0;
    const dragEnterHandler = function (event) {
      dragEnterCount++;
      enterDropArea();
      event.preventDefault();
    };
    const dragLeaveHandler = function (event) {
      if (!--dragEnterCount) leaveDropArea();
      event.preventDefault();
    };
    const dragOverHandler = function (event) {
      event.preventDefault();
    };
    const dropHandler = function (event) {
      event.preventDefault();
      if (inArea) {
        const items = dragItems.splice(0);
        askFast(items.map(({ type, value }) => ({ type, value })));
      }
      dragEndHandler();
    };
    document.addEventListener('dragstart', dragStartHandler);
    document.addEventListener('dragend', dragEndHandler);
    dropArea.addEventListener('dragenter', dragEnterHandler);
    dropArea.addEventListener('dragleave', dragLeaveHandler);
    dropArea.addEventListener('dragover', dragOverHandler);
    dropArea.addEventListener('drop', dropHandler);

    dropArea.classList.add('gn_topmenulist', 'yawf-drop-area');
    dropArea.innerHTML = '<div class="W_layer_arrow"><span class="W_arrow_bor W_arrow_bor_t"><i class="S_line3"></i><em class="S_bg2_br"></em></span></div>';

    const dropAreaContent = document.createElement('div');
    dropAreaContent.classList.add('yawf-drop-content');
    dropArea.appendChild(dropAreaContent);
    dropAreaContent.innerHTML = '<div class="yawf-drop-title"></div><div class="yawf-drop-text"></div>';

    // 还没支持新版，我们先给他注释掉
    if (Math.E < 0) init.onLoad(function addDropArea() {
      const reference = document.querySelector('.yawf-gn_set_list');
      if (!reference) {
        setTimeout(addDropArea, 100);
        return;
      }
      dropAreaContent.querySelector('.yawf-drop-title').textContent = i18n.dropAreaTitle;
      dropAreaContent.querySelector('.yawf-drop-text').textContent = i18n.dropAreaContent;
      reference.appendChild(dropArea);
    });

  }());

  css.append(`
.yawf-fast-add-body { padding: 20px; }
.yawf-fast-add-list { padding: 20px; }
.yawf-drop-area { width: 224px; height: 224px; top: 34px; right: -119px; display: none; opacity: 0.8; }
.yawf-drop-area.yawf-drag { display: block; }
.yawf-drop-area.yawf-drag-in { opacity: 1; }
.WB_global_nav .gn_topmenulist.yawf-drop-area .W_layer_arrow .W_arrow_bor_t { right: 122px; }
.yawf-drop-content { margin: 20px; border: 5px dashed #666; border-radius: 20px; text-align: center; white-space: wrap; width: 134px; height: 134px; padding: 20px; margin: 20px; line-height: 1.5; }
.yawf-drop-title { font-size: 16px; font-weight: bold; white-space: pre-wrap; margin: 0 0 20px; user-select: none; }
.yawf-drop-area-active .gn_topmenulist_yawf { display: none; }
`);

}());
