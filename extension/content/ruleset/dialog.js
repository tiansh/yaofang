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
    container.innerHTML = '<div class="WB_minitab yawf-config-header" node-type="yawf-config-header"><ul class="minitb_ul S_line1 S_bg1 clearfix"></ul></div>';
    return container.removeChild(container.firstChild);
  };
  configDom.search = () => {
    const container = document.createElement('ul');
    container.innerHTML = '<li class="minitb_item S_line1 yawf-config-tab yawf-config-tab-search"><label class="minitb_lk S_txt1"><input id="yawf-config-search" class="yawf-config-search" type="search"><span class="yawf-config-search-logo W_ficon S_txt2">f</span></label></li>';
    return container.removeChild(container.firstChild);
  };
  configDom.item = title => {
    const container = document.createElement('ul');
    container.innerHTML = '<li class="minitb_item S_line1 yawf-config-tab"><a class="minitb_lk S_txt1 S_bg1 S_bg2" action-type="tab_item" href="javascript:void(0);"></a></li>';
    const text = container.querySelector('a');
    text.appendChild(title);
    return container.removeChild(container.firstChild);
  };
  configDom.right = () => {
    const container = document.createElement('div');
    container.innerHTML = '<div node-type="yawf-config-body" class="yawf-config-body yawf-window-body"></div>';
    return container.removeChild(container.firstChild);
  };
  configDom.layer = () => {
    const container = document.createElement('div');
    container.innerHTML = '<div class="yawf-config-layer"></div>';
    return container.removeChild(container.firstChild);
  };

  const renderTip = (layer, text) => {
    layer.innerHTML = '<div class="WB_empty"><div class="WB_innerwrap"><div class="empty_con clearfix"><p class="icon_bed"><i class="W_icon icon_warnB"></i></p><p class="text"></p></div></div></div>';
    layer.querySelector('.text').textContent = text;
  };

  const renderSearch = (layer, input) => {
    const searchTexts = (input.match(/\S+/g) || []).filter(x => !x.includes(':')).map(t => t.toUpperCase());
    const [_verMatch, verOp, verNum] = input.match(/\bver(?:sion)?:([><]?=?)(\d+)\b/) || [];
    const versionTest = {
      '>': v => v > verNum,
      '<': v => v < verNum,
      '>=': v => v >= verNum,
      '<=': v => v <= verNum,
      '=': v => v === +verNum,
      '': v => v === +verNum,
    }[verOp] || (() => true);
    layer.innerHTML = '';
    if (!searchTexts.length && verNum == null) {
      renderTip(layer, i18n.searchEmptyInput);
      return;
    }
    const items = rule.query({
      filter(item) {
        if (!item.version) return false;
        if (!versionTest(item.version)) return false;
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
  const renderTabs = function (inner, tabs) {
    inner.classList.add('yawf-config-inner');
    const left = inner.appendChild(configDom.left());
    const right = inner.appendChild(configDom.right());
    const tablist = left.querySelector('ul');
    const search = tablist.appendChild(configDom.search());
    const searchInput = search.querySelector('input');
    /** @type {Element?} */
    let current = null;
    /** @type {WeakMap<Element, Function>} */
    const tabInit = new WeakMap();
    const tabLayer = tabs.map(tab => {
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
    const tabLeft = tabs.map((tab, index) => {
      const layer = tabLayer[index];
      const tabLeft = tablist.appendChild(configDom.item(tab.getRenderResult()));
      tabInit.set(tabLeft, () => {
        hideAllLayer();
        layer.innerHTML = '';
        render(layer, rule.query({ base: [tab] }));
        layer.style.display = 'block';
      });
      return tabLeft;
    });
    const searchLayer = right.appendChild(configDom.layer());
    searchLayer.classList.add('yawf-config-layer-search');
    tabInit.set(search, () => {
      hideAllLayer();
      searchLayer.innerHTML = '';
      renderSearch(searchLayer, searchInput.value);
      searchLayer.style.display = 'block';
    });
    const setCurrent = tabLeft => {
      if (current === tabLeft) return;
      if (current) current.classList.remove('current');
      current = tabLeft;
      tabLeft.classList.add('current');
      if (search !== tabLeft && searchInput.value) searchInput.value = '';
      tabInit.get(tabLeft)();
    };
    // 自动选中第一个选项卡
    setCurrent(tabLeft[0]);
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

  rule.dialog = function (rules = null) {
    try {
      ui.dialog({
        id: 'yawf-config',
        title: i18n.configDialogTitle,
        render: inner => {
          if (!rules) renderTabs(inner, tabs);
        },
      }).show();
    } catch (e) { util.debug('Error while showing rule dialog %o', e); }
  };

  css.append(`
#yawf-config .yawf-config-inner { padding: 0 0 0 160px; width: 640px; height: 480px; position: relative; }
#yawf-config .yawf-config-header { position: absolute; width: 160px; height: 480px; top: 0; left: 0; }
#yawf-config .yawf-config-header ul { height: 450px; width: 120px; overflow: hidden; padding: 20px 0 10px 40px; box-shadow: -4px 0 2px -2px rgba(64, 64, 64, 0.15) inset, 0 4px 2px -2px rgba(64, 64, 64, 0.15) inset; }
#yawf-config .yawf-config-header li { display: block; width: 120px; height: 25px; border-style: solid none; margin-top: -1px; }
#yawf-config .yawf-config-header a,
#yawf-config .yawf-config-header label { width: 100px; padding: 0 10px; position: relative; z-index: 1; }
#yawf-config .yawf-config-header .yawf-config-tab:not(.current) a { background: none transparent; }
#yawf-config .yawf-config-header .yawf-config-search { -moz-appearance: none; -webkit-appearance: none; background: none transparent; border: medium none; height: 25px; padding: 0 0 0 30px; text-align: right; width: 70px; box-sizing: content-box; position: relative; z-index: 2; }
#yawf-config .yawf-config-search-logo { clear: both; display: block; float: left; left: 45px; position: relative; top: -27px; transition: left linear 0.2s; cursor: text; font-weight: normal; }
#yawf-config .yawf-config-header li.current .yawf-config-search-logo,
#yawf-config .yawf-config-search:focus ~ .yawf-config-search-logo { left: 15px; }
#yawf-config .yawf-config-body { padding: 10px 20px 20px; width: 600px; max-height: 450px; overflow: auto; box-shadow: 0 4px 2px -2px rgba(64, 64, 64, 0.15) inset; position: relative; line-height: 20px; }
#yawf-config .yawf-config-layer { padding-bottom: 20px; min-height: 400px; }
#yawf-config .yawf-config-layer.current { display: block; }
`);


}());
