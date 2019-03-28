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

  i18n.manuallyHideFeed = {
    cn: '在微博右上角显示隐藏单条微博的按钮',
    tw: '在微博右上角顯示隱藏單條微博的按鈕',
    en: 'Show buttons at right top of each feeds for hidding',
  };
  i18n.hideThisFeed = {
    cn: '隐藏',
    tw: '隱藏',
    en: 'Hide',
  };

  const hideListPromise = async function () {

    const manuallyHideConfig = await config.pool('Hide', { uid: init.page.$CONFIG.uid });

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
