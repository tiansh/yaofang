; (async function () {

  const yawf = window.yawf;
  const config = yawf.config;
  const init = yawf.init;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;
  const ui = util.ui;
  const css = util.css;

  i18n.feedsManuallyGroupTitle = {
    cn: '手动隐藏',
    tw: '手動隱藏',
    en: 'Manually',
  };

  const manually = filter.manually = {};
  manually.manually = rule.Group({
    parent: filter.filter,
    template: () => i18n.feedsManuallyGroupTitle,
  });

  Object.assign(i18n, {
    manuallyHideFeed: {
      cn: '在微博右上角显示隐藏单条微博的按钮|{{reset}}|{{i}}',
      tw: '在微博右上角顯示隱藏單條微博的按鈕|{{reset}}|{{i}}',
      en: 'Show buttons at right top of each feeds for hiding|{{reset}}|{{i}}',
    },
    manuallyHideFeedReset: {
      cn: '重置',
      tw: '重設',
      en: 'Reset',
    },
    manuallyHideFeedDetail: {
      cn: '扩展会保存最近一万条被隐藏的微博的编号，并在遇到这些微博时将他们隐藏。这些微博的编号将不会包含在导出的设置中，且不会随着导入的设置而失效。重置设置或在此重置可以清空这个列表。',
    },
    manuallyHideFeedDialogTitle: {
      cn: '重置隐藏',
      tw: '重設隱藏',
      en: 'Reset Hadding',
    },
    manuallyHideFeedDialogText: {
      cn: '确定清除隐藏微博的历史记录吗，清除后之前隐藏的微博会重新显示。',
      tw: '確定清除隱藏微博的歷史記錄嗎，清除後之前隱藏的微博會重新顯示。',
      en: 'Clear history of hiding will make these feeds shown again. Clear hidden history?',
    },
    hideThisFeed: {
      cn: '隐藏',
      tw: '隱藏',
      en: 'Hide',
    },
  });

  const hideListPromise = async function () {

    const manuallyHideConfig = await config.pool('Hide', {
      uid: init.page.$CONFIG.uid,
    });

    return new rule.class.OffscreenConfigItem({
      id: 'hideList',
      configPool: manuallyHideConfig,
      get initial() { return []; },
      normalize(value) {
        if (!value) return [];
        if (!Array.isArray(value)) return [];
        return value.slice(0, 1000);
      },
    });

  };

  let hideList = null;
  init.onReady(async function () {
    hideList = await hideListPromise();
  }, { priority: util.priority.BEFORE, async: true });

  manually.manuallyHideFeed = rule.Rule({
    id: 'filter_manually_hide',
    version: 1,
    parent: manually.manually,
    template: () => i18n.manuallyHideFeed,
    ref: {
      reset: {
        render() {
          const container = document.createElement('div');
          container.innerHTML = '<a class="W_btn_b yawf-manually-hide-reset" href="javascript:;"><span class="W_f14"></span></a>';
          container.querySelector('span').textContent = i18n.manuallyHideFeedReset;
          const button = container.querySelector('a');
          button.addEventListener('click', async event => {
            if (!event.isTrusted) return;
            const answer = await ui.confirm({
              id: 'yawf-import-failed',
              title: i18n.manuallyHideFeedDialogTitle,
              text: i18n.manuallyHideFeedDialogText,
            });
            if (!answer) return;
            hideList.configPool.reset();
          });
          return button;
        },
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.manuallyHideFeedDetail },
    },
    ainit() {
      const createScreen = function () {
        const screen = document.createElement('div');
        screen.classList = 'WB_screen W_fr';
        return screen;
      };
      const createHideBox = function () {
        const hideBox = document.createElement('div');
        hideBox.classList = 'yawf-hide-box';
        hideBox.innerHTML = '<a href="javascript:void(0);"><i class="W_ficon ficon_close S_ficon">X</i></a>';
        hideBox.querySelector('a').title = i18n.hideThisFeed;
        return hideBox;
      };
      const hideFeedEventHandler = function (feed, mid) {
        return function (event) {
          if (!event.isTrusted) return;
          feed.setAttribute('style', 'transition: max-height opacity 0.2s; max-height: ' + feed.clientHeight + 'px; overflow: hidden; position: relative;');
          setTimeout(() => { feed.style.maxHeight = '20px'; }, 0);
          setTimeout(() => { feed.parentNode.removeChild(feed); }, 100);
          const list = hideList.getConfig();
          list.unshift(mid);
          list.splice(1e4);
          hideList.setConfig(list);
        };
      };
      observer.feed.onFinally(function (feed) {
        const [authorId] = feedParser.author.id(feed);
        if (!authorId || authorId === init.page.$CONFIG.uid) return; // 自己的微博，不显示按钮
        if (feed.matches('#v6_pl_content_atmeweibo *')) return; // 不在提到页面显示，避免与“屏蔽at”发生歧义
        if (feed.hasAttribute('yawf-hide-box')) return; // 已经有了按钮，不显示按钮
        if (feed.querySelector('.screen_box .ficon_close')) return; // 广告微博右上角已经有个叉了，就不再弄一个了
        if (document.querySelector('[id^="Pl_Official_WeiboDetail__"]')) return; // 单条微博页面，不显示按钮
        if (!feed.hasAttribute('mid')) return; // 不是微博，不显示按钮
        feed.setAttribute('yawf-hide-box', 'yawf-hide-box');
        const mid = feed.getAttribute('mid');
        const screenBox = feed.querySelector('.WB_screen .screen_box');
        if (mid && screenBox) {
          const hideBox = screenBox.parentNode.insertBefore(createHideBox(), screenBox);
          hideBox.querySelector('a').addEventListener('click', hideFeedEventHandler(feed, mid));
        }
        const omid = feed.getAttribute('omid');
        const expand = feed.querySelector('.WB_expand');
        if (omid && expand) {
          const screen = expand.insertBefore(createScreen(), expand.firstChild);
          const hideBox = screen.appendChild(createHideBox());
          hideBox.querySelector('a').addEventListener('click', hideFeedEventHandler(feed, omid));
        }
      });
      css.append(`
.WB_screen .yawf-hide-box { margin: -10px 0 0 -17px; position: absolute; }
.WB_screen .yawf-hide-box .W_ficon { font-size: 18px; height: 16px; padding: 4px 0 6px; text-align: center; }
.WB_screen .yawf-hide-box ~ .screen_box { margin: -10px 0 0 -37px; position: absolute; }
.WB_screen .yawf-hide-box ~ .screen_box .W_ficon, .WB_screen .yawf-hide_box .W_ficon { width: 20px; }
.WB_screen .yawf-hide-box ~ .screen_box .layer_menu_list { right: -4px; }
.WB_expand .WB_screen { margin-top: 5px; }
`);
    },
    init() {
      const rule = this;
      observer.feed.filter(function showMyFeed(feed) {
        // 选项的开关只影响是否显示按钮，过滤规则总是执行
        const mid = feed.getAttribute('mid');
        const omid = feed.getAttribute('omid');
        const midList = hideList.getConfig();
        if (midList.includes(mid)) return 'hide';
        if (midList.includes(omid)) return 'hide';
        return null;
      }, { priority: 1e4 });
    },
  });

}());
