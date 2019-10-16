; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const pagemenu = yawf.pagemenu;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;
  const css = util.css;

  i18n.feedsPauseGroupTitle = {
    cn: '暂停过滤',
    tw: '暫停篩選',
    en: 'Pause Filter',
  };

  const pause = filter.pause = {};
  pause.pause = rule.Group({
    parent: filter.filter,
    template: () => i18n.feedsPauseGroupTitle,
  });

  Object.assign(i18n, {
    pauseFilter: {
      cn: '临时禁用所有微博过滤规则|{{i}}',
      tw: '暫時停用所有微博篩選規則|{{i}}',
      en: 'Disable all feed filters temporarily|{{i}}',
    },
    pauseFilterDetail: {
      cn: '选择后将会暂停所有微博过滤相关的功能，要查看已被隐藏的规则需要刷新页面。其他功能不受影响。',
    },
    pauseFilterMenu: {
      cn: '暂停微博过滤',
      tw: '暫停微博篩選',
      en: 'Pause Filter',
    },
    pauseFilterConfigWarning: {
      cn: '您已禁用微博过滤功能，部分设置将不生效',
      tw: '您已停用微博篩選功能，部分設定將不生效',
      en: 'Filters has been paused. Some settings may not take effect.',
    },
    pauseFilterConfigEnable: {
      cn: '启用过滤规则',
      tw: '啟用過濾規則',
      en: 'Enable Filters',
    },
    pauseFilterMenuEnabled: {
      cn: '启用微博过滤',
      tw: '啟用微博過濾',
      en: 'Enable Filters',
    },
    pauseFilterMenuDisabled: {
      cn: '暂停微博过滤',
      tw: '暫停微博篩選',
      en: 'Pause Filters',
    },
    pauseFilterFeedWarning: {
      cn: '微博过滤规则已暂停，以下微博可能未经过滤，点此启用过滤规则',
      tw: '微博篩選規則已暫停，以下微博可能未經篩選，按此啟用篩選規則',
      en: 'Feed filters has been disabled. Click here to enable filters.',
    },
  });


  pause.pauseFilter = rule.Rule({
    id: 'pause_filter',
    version: 1,
    parent: pause.pause,
    template: () => i18n.pauseFilter,
    ref: {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.pauseFilterDetail },
    },
    init() {
      const rule = this;

      // 其实实现逻辑很简单，就是声明一个优先级很高的过滤规则，无论看到什么，都说不用继续过滤了
      observer.feed.filter(function pauseFilterFilter(/** @type {Element} */feed) {
        if (!rule.isEnabled()) return null;
        return 'unset'; // 既不是白名单，也不隐藏
      }, { priority: 1e6 });
      this.addConfigListener(() => { observer.feed.rerun(); });

      // 在设置窗口上显示大大的提示文字，说明过滤功能被暂停了
      const addNoticeInConfig = function () {
        if (!rule.isEnabled()) {
          const body = document.querySelector('.yawf-config-body.yawf-config-filter-pause');
          if (!body) return;
          body.classList.remove('yawf-config-filter-pause');
          const notice = document.querySelector('.yawf-config-filter-pause-notice');
          notice.parentNode.removeChild(notice);
          return;
        }
        const body = document.querySelector('.yawf-config-body:not(.yawf-config-filter-pause)');
        if (!body) return;
        body.classList.add('yawf-config-filter-pause');
        const container = document.createElement('div');
        container.innerHTML = '<div class="yawf-config-filter-pause-notice S_link1_br"><span></span><a href="javascript:;" class="W_btn_b yawf-config-filter-enable"><span class="W_f14"></span></a></div>';
        container.querySelector('span').textContent = i18n.pauseFilterConfigWarning;
        const button = container.querySelector('a');
        button.querySelector('span').textContent = i18n.pauseFilterConfigEnable;
        button.addEventListener('click', event => {
          if (!event.isTrusted) return;
          rule.setConfig(false);
        });
        body.insertBefore(container.firstChild, body.firstChild);
      };

      observer.dom.add(function configNotice() {
        addNoticeInConfig();
      });
      this.addConfigListener(() => { addNoticeInConfig(); });

      // 在漏斗图标下面的菜单里面，也放上这个
      const menuText = function () {
        if (rule.isEnabled()) return i18n.pauseFilterMenuEnabled;
        return i18n.pauseFilterMenuDisabled;
      };
      const menuitem = pagemenu.add({
        title: menuText,
        onClick: function () {
          const oldConfig = rule.getConfig();
          rule.setConfig(!oldConfig);
        },
        section: 10,
        order: 1,
      });
      ; (async function () {
        const item = await menuitem;
        rule.addConfigListener(() => { item.text(menuText); });
        item.text(menuText);
      }());

      // 在消息流顶端，再放上这个
      observer.feed.onBefore(function (feed) {
        if (!rule.isEnabled()) return;
        const list = feed.closest('.WB_feed');
        if (!list) return; // 搜索页面
        const container = list.parentNode;
        const sibling = container.previousSibling;
        if (sibling && sibling.nodeType === Node.ELEMENT_NODE) {
          if (sibling.matches('.yawf-feed-filter-pause-notice')) return;
        }
        const wrap = document.createElement('div');
        wrap.innerHTML = '<div class="yawf-feed-filter-pause-notice S_bg2"><a class="S_txt1"></a></div>';
        const button = wrap.querySelector('a');
        button.textContent = i18n.pauseFilterFeedWarning;
        button.addEventListener('click', event => {
          if (!event.isTrusted) return;
          rule.setConfig(false);
        });
        container.parentNode.insertBefore(wrap.firstChild, container);
      });
      this.addConfigListener(() => {
        if (rule.isEnabled()) return;
        const notice = document.querySelector('.yawf-feed-filter-pause-notice');
        if (notice) notice.parentNode.removeChild(notice);
      });

      css.append(`
.yawf-config-filter-pause-notice { border-width: 5px; border-style: solid; padding: 10px; font-size: 115%; }
.yawf-config-filter-enable { float: right; margin: -2px; }
.yawf-feed-filter-pause-notice { text-align: center; line-height: 31px; margin-bottom: 10px; border-radius: 3px; font-size: 115%; }
`);
    },
  });

}());
