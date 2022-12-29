/**
 * 这个文件用于显示一个显示了若干条规则的对话框
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const ui = util.ui;
  const i18n = util.i18n;
  const css = util.css;

  const rule = yawf.rule;
  const tabs = rule.tabs;

  Object.assign(i18n, {
    configDialogTitle: {
      cn: '设置 - 药方 (YAWF)',
      tw: '設定 - 藥方 (YAWF)',
      en: 'Settings - YAWF (Yet Another Weibo Filter)',
    },
    searchEmptyInput: { cn: '键入以搜索设置项', tw: '鍵入以搜尋設定項', en: 'Type to search settings' },
    searchEmptyResult: { cn: '未找到与您输入匹配的设置项', tw: '未找到與您輸入匹配的設置項', en: 'No Matched Settings' },
  });

  /** @type {{ [e: string]: () => HTMLElement }} */
  const configDom = {};
  configDom.left = () => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="yawf-config-header"><ul class="woo-box-flex woo-tab-nav"></ul></div>';
    return container.removeChild(container.firstChild);
  };
  configDom.search = () => {
    const container = document.createElement('ul');
    container.innerHTML = '<li class="woo-tab-item-main yawf-config-tab yawf-config-tab-search"><label><input id="yawf-config-search" class="woo-input-main yawf-config-search" type="search"><i data-v-2621="" class="woo-font icon woo-font--search yawf-config-search-logo"></i></label></li>';
    return container.removeChild(container.firstChild);
  };
  configDom.item = title => {
    const container = document.createElement('ul');
    container.innerHTML = '<li class="woo-tab-item-main yawf-config-tab"><button></button></li>';
    const text = container.querySelector('button');
    text.appendChild(title);
    return container.removeChild(container.firstChild);
  };
  configDom.right = () => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="yawf-config-body yawf-window-body"></div>';
    return container.removeChild(container.firstChild);
  };
  configDom.layer = () => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="yawf-config-layer"></div>';
    return container.removeChild(container.firstChild);
  };

  const renderTip = (layer, text) => {
    layer.innerHTML = '<div class="woo-tip-main woo-tip-vertical yawf-empty-tip"><span class="woo-tip-icon woo-tip-warnFill yawf-empty-tip-icon"></span><span class="woo-tip-text yawf-tip-text"></p></div>';
    layer.querySelector('.woo-tip-icon').appendChild(ui.icon('warn').documentElement).setAttribute('class', 'woo-tip-icon');
    layer.querySelector('.yawf-tip-text').textContent = text;
  };

  const renderSearch = (layer, input, filter) => {
    const searchTexts = (input.match(/\S+/g) || []).filter(x => !x.includes(':')).map(t => t.toUpperCase());
    const [_verMatch, verOp, verNum] = input.match(/\bver(?:sion)?:([><]?=?)(\d+)\b/) || [];
    const versionTest = {
      '>': v => v > verNum,
      '<': v => v < verNum,
      '>=': v => v >= verNum,
      '<=': v => v <= verNum,
      '=': v => v === +verNum,
      '': v => v === +verNum,
    }[verOp] ?? (() => true);
    layer.innerHTML = '';
    if (!searchTexts.length && verNum == null) {
      renderTip(layer, i18n.searchEmptyInput);
      return;
    }
    const items = rule.query({
      filter: function (item) {
        if (!item.version) return false;
        if (!versionTest(item.version)) return false;
        if (typeof filter === 'function' && !filter(item)) return false;
        const text = item.text().toUpperCase();
        if (searchTexts.some(t => !text.includes(t))) return false;
        return true;
      },
    });
    if (items.length === 0) {
      renderTip(layer, i18n.searchEmptyResult);
      return;
    }
    render(layer, items);
  };

  /**
   * @param {Element} inner
   * @param {Array<Tab>} tabs
   */
  const renderTabs = function (inner, tabs, { initial = null, filter = null } = {}) {
    inner.classList.add('yawf-config-inner');
    const left = inner.appendChild(configDom.left());
    const right = inner.appendChild(configDom.right());

    // 后续移除这段
    const v7Tip = document.createElement('div');
    v7Tip.innerHTML = '<div class="tip woo-box-flex woo-box-alignCenter woo-box-justifyCenter woo-tip-main woo-tip-flat woo-tip-error" style="padding: 10px;"><span class="woo-tip-text">药方（YAWF）针对微博新版（V7）的支持正在开发中！目前绝大多数功能暂不支持新版！！欢迎到 <a href="https://github.com/tiansh/yaofang" target="_blank" rel="noopener">项目主页</a> 贡献代码！</span></div>';
    const text = v7Tip.querySelector('.woo-tip-text');
    text.parentElement.insertBefore(ui.icon('error').documentElement, text).setAttribute('style', 'width: 32px; height: 32px;');
    right.appendChild(v7Tip.firstChild);

    const tablist = left.querySelector('ul');
    const search = tablist.appendChild(configDom.search());
    const searchInput = search.querySelector('input');
    const renderTabs = tabs.filter(tab => tab.type === 'tab');
    /** @type {Element?} */
    let current = null;
    /** @type {WeakMap<Element, Function>} */
    const tabInit = new WeakMap();
    const tabLayer = renderTabs.map(tab => {
      const layer = right.appendChild(configDom.layer());
      return layer;
    });
    const hideAllLayer = function () {
      [...tabLayer, searchLayer].forEach(layer => {
        if (layer.style.display !== 'none') {
          layer.style.display = 'none';
        }
      });
    };
    const tabLeft = renderTabs.map((tab, index) => {
      const layer = tabLayer[index];
      const tabLeft = tablist.appendChild(configDom.item(tab.getRenderResult()));
      tabInit.set(tabLeft, () => {
        hideAllLayer();
        layer.innerHTML = '';
        render(layer, rule.query({ base: [tab], filter }));
        layer.style.display = 'block';
      });
      return tabLeft;
    });
    const searchLayer = right.appendChild(configDom.layer());
    searchLayer.classList.add('yawf-config-layer-search');
    tabInit.set(search, () => {
      hideAllLayer();
      searchLayer.innerHTML = '';
      renderSearch(searchLayer, searchInput.value, filter);
      searchLayer.style.display = 'block';
    });
    const setCurrent = tabLeft => {
      if (current === tabLeft) return;
      const currentClassName = 'woo-tab-active';
      if (current) current.classList.remove('yawf-current', currentClassName);
      current = tabLeft;
      tabLeft.classList.add('yawf-current', currentClassName);
      if (search !== tabLeft && searchInput.value) searchInput.value = '';
      tabInit.get(tabLeft)();
      right.scrollTo(0, 0);
    };
    // 自动选中目标选项卡，或第一个选项卡
    setCurrent(tabLeft[(initial && renderTabs.indexOf(initial) + 1 || 1) - 1]);
    left.addEventListener('click', event => {
      const tabLeft = event.target.closest('.yawf-config-tab');
      if (!tabLeft) return;
      if (tabLeft === search) return;
      setCurrent(tabLeft);
    });
    // 当在搜索框里面输入内容的时候，选中搜索框并刷新结果
    searchInput.addEventListener('input', event => {
      if (!searchInput.value && current !== search) return;
      if (current !== search) setCurrent(search);
      else tabInit.get(search)();
    });
  };

  const render = function (inner, items) {
    const groups = new Map();
    items.forEach(item => {
      if (!groups.has(item.parent)) {
        groups.set(item.parent, []);
      }
      groups.get(item.parent).push(item);
    });
    [...groups.entries()].forEach(([group, items]) => {
      try {
        inner.appendChild(group.getRenderResult());
        const container = document.createElement('div');
        container.classList.add('yawf-config-group-items');
        items.forEach(item => {
          let node = item.getRenderResult();
          container.appendChild(node);
        });
        inner.appendChild(container);
      } catch (e) {
        util.debug('Error while render config list:', e);
      }
    });
  };
  rule.render = render;

  rule.dialog = function (tab = null, filter = null) {
    try {
      ui.dialog({
        id: 'yawf-config',
        title: i18n.configDialogTitle,
        render: inner => {
          renderTabs(inner, tabs, { initial: tab, filter });
        },
        bar: true,
      }).show();
    } catch (e) { util.debug('Error while showing rule dialog %o', e); }
  };

  css.append(`
#yawf-config { width: 800px; font-size: 14px; }
#yawf-config .yawf-config-inner { padding: 0 0 0 160px; width: 640px; height: 480px; position: relative; }
#yawf-config .yawf-config-header { position: absolute; width: 160px; height: 480px; top: 0; left: 0; }
#yawf-config .yawf-config-header ul { height: 442px; width: 120px; overflow: hidden; padding: 20px 0 20px 40px; border-right: 10px solid var(--frame-background); }
#yawf-config .yawf-config-header li { display: block; width: 120px; height: 25px; line-height: 25px; }
#yawf-config .yawf-config-header li.yawf-current { box-shadow: -2px 0 var(--w-brand) inset; font-weight: bold; }
#yawf-config .yawf-config-header li:hover button { background: var(--w-hover) !important; border-radius: 15px; }
#yawf-config .yawf-config-header button,
#yawf-config .yawf-config-header label { width: 120px; padding: 0; border: none; background: none; position: relative; z-index: 1; }
#yawf-config .yawf-config-header button { color: inherit; outline: none; cursor: pointer; font: inherit; }
#yawf-config .yawf-config-header .yawf-config-search { appearance: none; background: none transparent; height: 25px; padding: 0 10px   0 30px; text-align: right; width: 80px; box-sizing: content-box; position: relative; z-index: 2; }
#yawf-config .yawf-config-search-logo { clear: both; display: block; float: left; left: 55px; position: relative; top: -18px; transition: left linear 0.2s; cursor: text; font-weight: normal; }
#yawf-config .yawf-config-header li.yawf-current .yawf-config-search-logo,
#yawf-config .yawf-config-search:focus ~ .yawf-config-search-logo { left: 15px; }
#yawf-config .yawf-config-body { padding: 10px 20px 20px; width: 600px; max-height: 450px; overflow: auto; position: relative; line-height: 20px; }
#yawf-config .yawf-config-layer { padding-bottom: 20px; min-height: 400px; }
#yawf-config .yawf-config-layer.yawf-current { display: block; }
#yawf-config .woo-dialog-main { width: 800px; max-width: none; padding: 0; overflow: hidden; }
#yawf-config .woo-dialog-title { margin-bottom: 0; }
#yawf-config .woo-tab-nav { margin: 0; flex-direction: column; }
#yawf-config .yawf-empty-tip { text-align: center; }
#yawf-config .yawf-empty-tip-icon { display: block; margin: 0 auto 20px; padding-top: 150px; }
`);

}());
