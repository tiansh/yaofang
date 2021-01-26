; (function () {

  const yawf = window.yawf;
  const config = yawf.config;
  const init = yawf.init;
  const util = yawf.util;
  const rule = yawf.rule;
  const request = yawf.request;
  const download = yawf.download;
  const observer = yawf.observer;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;
  const functools = util.functools;
  const ui = util.ui;
  const css = util.css;

  const getContext = functools.once(async function () {
    const followConfig = await config.pool('Follow', {
      uid: init.page.$CONFIG.uid,
      isLocal: true,
    });
    const fetchData = new rule.class.OffscreenConfigItem({
      id: 'fetchData',
      configPool: followConfig,
      get initial() { return {}; },
      setConfig(value) {
        value.timestamp = Date.now();
        return super.setConfig(value);
      },
      restart() {
        const value = this.getConfig();
        value.startTime = Date.now();
        this.setConfig(value);
        return value.startTime;
      },
      isOutDated() {
        const value = this.getConfig();
        if (!value.timestamp) return false;
        return value.startTime < Date.now() - 864e5 * 3;
      },
      // 其实设置读写并不是同步的，但是也没什么更好的办法就是了
      getLock() {
        const value = this.getConfig();
        const lock = Date.now() + [...Array(100)].map(_ => Math.random() * 10 | 0).join('');
        value.lock = lock;
        this.setConfig(value);
        return lock;
      },
      assertLock(lock) {
        const value = this.getConfig();
        if (value.lock !== lock) {
          throw Error('Fetching follow list error: Lock lost');
        }
      },
      touchTimestamp() {
        const value = this.getConfig();
        this.setConfig(value);
        return value.lock;
      },
      normalize(value) {
        const base = (function () {
          if (!value) return {};
          if (!value.timestamp) return {};
          if (value.timestamp > Date.now() + 60e3) return {};
          if (value.timestamp < Date.now() - 86400e3 * 7) return {};
          if (value.allPages && !value.startTime) {
            value.startTime = Date.now();
          }
          if (value.pendingPages) {
            if (!Array.isArray(value.list)) return {};
          }
          return value;
        }());
        base.weiboVersion = yawf.WEIBO_VERSION;
        return base;
      },
    });
    const lastList = new rule.class.OffscreenConfigItem({
      id: 'lastList',
      configPool: followConfig,
      get initial() { return null; },
      normalize(value) {
        if (!value) return null;
        if (!value.timestamp) return null;
        if (!Array.isArray(value.list)) return null;
        return value;
      },
    });
    const lastChange = new rule.class.OffscreenConfigItem({
      id: 'lastChange',
      configPool: followConfig,
      get initial() { return null; },
      normalize(value) {
        if (!value) return null;
        if (!value.timestamp) return null;
        if (!Array.isArray(value.add)) value.add = [];
        if (!Array.isArray(value.lost)) value.lost = [];
        if (!Array.isArray(value.rename)) value.rename = [];
        return value;
      },
    });
    const configs = { fetchData, lastList, lastChange };
    return configs;
  });

  let followingContext = null;
  init.onReady(async function () {
    followingContext = await getContext();
  }, { priority: util.priority.BEFORE });

  /** @typedef {'inactive'|'waiting'|'starting'|'pending'|'running'|'running_fail'|'checking'|'checking_fail'} UpdateStatusStatus */
  /** @type {{ status: UpdateStatusStatus, current: number, total: number, result: number }} */
  const updateStatus = {
    status: 'inactive',
    current: 0,
    total: 0,
    result: 0,
  };
  const reportUpdateStatus = function (/** @type {UpdateStatusStatus} */status) {
    const { fetchData } = followingContext;
    const fetchContext = fetchData.getConfig();
    Object.assign(updateStatus, {
      status,
      current: fetchContext.currentPage || 0,
      total: (fetchContext.allPages || []).length,
      result: (fetchContext.list || []).length,
    });
    following.autoCheckFollowing.ref.fetching.renderAllValues();
  };

  // 获取第一页的数据
  const fetchInitialize = async function () {
    const { fetchData } = followingContext;
    const lock = fetchData.touchTimestamp();
    fetchData.restart();
    const { allPages, followInPage } = await request.getFollowingPage(init.page.$CONFIG.uid);
    fetchData.assertLock(lock);
    const fetchContext = fetchData.getConfig();
    fetchContext.allPages = allPages;
    fetchContext.list = followInPage;
    fetchContext.currentPage = 1;
    fetchData.setConfig(fetchContext);
  };
  // 获取后一页的数据
  const fetchNext = async function () {
    const { fetchData } = followingContext;
    const lock = fetchData.touchTimestamp();
    const oldFetchContext = fetchData.getConfig();
    const currentPage = oldFetchContext.currentPage;
    const nextPage = oldFetchContext.allPages[currentPage];
    const { followInPage } = await request.getFollowingPage(init.page.$CONFIG.uid, nextPage);
    fetchData.assertLock(lock);
    const fetchContext = fetchData.getConfig();
    fetchContext.list.push(...followInPage);
    fetchContext.currentPage++;
    fetchData.setConfig(fetchContext);
  };
  // 检查是否已经获取完毕
  const hasNextPage = function () {
    const { fetchData } = followingContext;
    const fetchContext = fetchData.getConfig();
    return fetchContext.allPages.length > fetchContext.currentPage;
  };
  // 比对新旧列表不同
  const checkListDiff = function (list, newList, lastChange) {
    // 如果之前没有数据，那么也就不用对比
    if (!Array.isArray(list)) return { add: [], lost: [], rename: [] };
    const { add: lastAdd = [], lost: lastLost = [], rename: lastRename = [] } = lastChange || {};
    const sameFollowItem = (x, y) => x.id === y.id;
    const getName = x => x.name.replace(/@|\s?\(.*\)/g, '');
    // 先根据原有名单和未提交的更改恢复更早的名单
    const oldList = list
      .filter(x => !lastAdd.find(y => sameFollowItem(x, y))).concat(lastLost)
      .map(x => (lastRename.find(r => sameFollowItem(r.old, x)) || { old: x }).old);
    // 然后将新的名单与更早的名单比较
    const add = newList.filter(x => !oldList.find(y => sameFollowItem(y, x)));
    const lost = oldList.filter(y => !newList.find(x => sameFollowItem(y, x)));
    const rename = oldList.map(oldItem => {
      if (oldItem.type !== 'user') return null;
      const newItem = newList.find(n => sameFollowItem(n, oldItem));
      if (!newItem) return null;
      const oldName = getName(oldItem);
      const newName = getName(newItem);
      if (oldName === newName) return null;
      return Object.assign({}, newItem, {
        old: oldItem,
        new: newItem,
      });
    }).filter(v => v);
    return { add, lost, rename };
  };

  // 去除重复数据
  const removeDuplicate = function (list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // 触发刷新流程，如果此时已经完成则强制重新开始
  const updateFollowList = async function () {
    reportUpdateStatus('starting');
    const { fetchData, lastList, lastChange } = followingContext;

    // 如果连续 10 分钟没有更新，那么可能是之前负责更新的那个页面被关闭或者出错了
    const { timestamp, lock } = fetchData.getConfig();
    if (timestamp > Date.now() - 600e3 && lock) {
      setTimeout(() => {
        if (fetchData.getConfig().timestamp === timestamp) updateFollowList();
      }, 600e3);
      reportUpdateStatus('pending');
      return;
    }

    // 如果之前获取数据使用的微博版本和现在不一样，那么数据要丢弃
    if (fetchData.getConfig().weiboVersion !== yawf.WEIBO_VERSION) {
      fetchData.setConfig({});
    }

    try {
      if (fetchData.isOutDated()) {
        fetchData.setConfig({});
      }
      const lock = fetchData.getLock();
      util.debug('Fetch Follow: start follow fetching');
      // 如果之前获取到一半，那么就继续之前的工作，否则开始新工作
      if (!fetchData.getConfig().allPages) {
        util.debug('Fetch Follow: fetch first page');
        fetchData.assertLock(lock);
        await fetchInitialize();
        util.debug('Fetch Follow: fetch first done');
      }
      while (hasNextPage()) {
        reportUpdateStatus('running');
        await new Promise(resolve => setTimeout(resolve, 5e3));
        util.debug('Fetch Follow: fetch next page');
        fetchData.assertLock(lock);
        await fetchNext();
        util.debug('Fetch Follow: fetch next done');
      }
      fetchData.assertLock(lock);
      util.debug('Fetch Follow: fetch everything done');
    } catch (e) {
      util.debug(e);
      util.debug('Fetch Follow: fetching following failed');
      reportUpdateStatus('running_fail');
      return;
    }

    try {
      reportUpdateStatus('checking');
      const newList = removeDuplicate(fetchData.getConfig().list);
      const oldList = lastList.getConfig();
      const changeList = (lastChange.getConfig() || {});
      const { add, lost, rename } = checkListDiff(oldList && oldList.list, newList, changeList);

      const finishTime = Date.now();
      lastList.setConfig({ timestamp: finishTime, list: newList });
      if (add.length || lost.length || rename.length) {
        lastChange.setConfig({ timestamp: finishTime, add, lost, rename });
      } else {
        lastChange.setConfig(null);
      }
      fetchData.setConfig({});
    } catch (e) {
      util.debug('Fetch Follow: error while update result');
      util.debug(e);
      reportUpdateStatus('checking_fail');
    }
    reportUpdateStatus('inactive');
  };

  const clearFollowList = async function () {
    const { fetchData, lastList, lastChange } = followingContext;
    const { timestamp, lock } = fetchData.getConfig() || {};
    util.debug('Fetch Follow: clear fetching data.');
    if (timestamp > Date.now() - 600e3 && lock) {
      util.debug('Fetch Follow: Fetching seems in progress, and would break');
    }
    fetchData.setConfig({});
    lastList.setConfig(null);
    lastChange.setConfig(null);
  };

  const exportFollowList = async function ({ timestamp, list }) {
    const csvItem = string => {
      if (!/[",\s]/.test(string)) return string;
      return '"' + string.replace(/"/g, '""') + '"';
    };
    // 这里我们用上 BOM 可以获得更好的兼容性
    // 在前面放一列序号，这样即便不能处理 BOM ，也可以躲开最前面一行的序数，不会出什么问题
    const content = '\ufeff#,name,homepage,avatar\r\n' + list.map((item, index) => {
      const name = csvItem(item.description);
      const homepage = csvItem(new URL(item.url, 'https://weibo.com').href);
      const avatar = csvItem(new URL(item.avatar, 'https://weibo.com').href);
      return [index + 1, name, homepage, avatar].join(',');
    }).join('\r\n') + '\r\n'; // CRLF 换行符支持效果最好，而且也更合乎规范
    const blob = new Blob([content], { type: 'text/csv' });
    const date = new Date(timestamp).toISOString().replace(/[-]|T.*/g, '');
    const filename = download.filename('following-' + init.page.$CONFIG.uid + '-' + date + '.csv');
    download.blob({ blob, filename });
  };

  const formatLastTime = function (timestamp) {
    if (!timestamp) return i18n.autoCheckFollowingNever;
    const option = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const formatter = new Intl.DateTimeFormat(i18n.languageCode, option);
    return formatter.format(new Date(timestamp));
  };

  i18n.followingGroupTitle = {
    cn: '关注管理',
    tw: '關注管理',
    en: 'Following',
  };

  const following = filter.following = {};
  following.following = rule.Group({
    parent: filter.filter,
    template: () => i18n.followingGroupTitle,
  });

  Object.assign(i18n, {
    autoCheckFollowing: {
      cn: '自动检查关注列表并提示变化|{{frequency}}{{i}}||{{buttons}}||{{fetching}}',
      tw: '自動檢查關注清單並提示變化|{{frequency}}{{i}}||{{buttons}}||{{fetching}}',
      en: 'Automatically checks and prompt any changes about following list | {{frequency}}{{i}}||{{buttons}}||{{fetching}}',
    },
    autoCheckFollowingDetail: {
      cn: '开启本功能后脚本会每隔一段时间，检查您的关注列表，并和上一次得到的结果比较，将不同之处展示出来。脚本检查关注列表只能像您在网页中检查关注列表一样，一页一页的翻看，因此检查可能需要较长的时间，如果您关注了大量的帐号，请考虑降低自动检查的频率。',
    },
    autoCheckFollowing1: { cn: '每天', tw: '每天', en: 'every day' },
    autoCheckFollowing3: { cn: '每三天', tw: '每三天', en: 'every 3 days' },
    autoCheckFollowing7: { cn: '每周', tw: '每週', en: 'every week' },
    autoCheckFollowingLastTime: { cn: '本地数据更新时间：', tw: '本機資料更新時間：', en: 'Last Update Time: ' },
    autoCheckFollowingNever: { cn: '暂无数据', tw: '暫無資料', en: 'Never' },
    autoCheckFollowingDownload: { cn: '导出关注列表', tw: '匯出關注清單', en: 'Export Follow List' },
    autoCheckFollowingClean: { cn: '清除本地数据', tw: '清除本機資料', en: 'Clear Data' },
    autoCheckFollowingNow: { cn: '立即更新数据', tw: '立即更新資料', en: 'Update Now' },
    autoCheckFollowingRunning: { cn: '（正在更新：{1}）', en: '(Updating: {1})' },
    autoCheckFollowingDialogTitle: { cn: '关注列表变化 - 药方 (YAWF)', tw: '關注清單變化 - 藥方 (YAWF)', en: 'Following List Changes - YAWF' },
    autoCheckFollowingTip: {
      cn: '您的关注列表自从上次检查并确认至今发生了如下变化，请您复查并确认：',
      tw: '您的關注清單自從上次檢查並確認至今發生了如下變化，請您複查並確認：',
      en: 'Your following list had been changed since last checking, please review and confirm: ',
    },
    autoCheckFollowingAdd: { cn: '新增如下关注', tw: '新增如下關注', en: 'Recent Following' },
    autoCheckFollowingLost: { cn: '减少如下关注', tw: '減少如下關注', en: 'Recent Unfollowed' },
    autoCheckFollowingRename: { cn: '如下关注修改了昵称', tw: '如下關注修改了暱稱', en: 'Recent Renamed' },
    autoCheckFollowingConfirmed: { cn: '已确认', tw: '已確認', en: 'Confirmed' },
    checkingProgress: {
      cn: '【{status}】{current}/{total}页，{result}关注',
      tw: '【{status}】{current}/{total}頁，{result}關注',
      en: '[{status}] {current}/{total} pages，{result} followings',
    },
    checkingProgressInactive: { cn: '尚未启动', tw: '尚未啟動', en: 'Inactive' },
    checkingProgressWaiting: { cn: '等待开始', tw: '等待開始', en: 'Wait to Start' },
    checkingProgressStarting: { cn: '正在初始化', tw: '正在初期化', en: 'Initializing' },
    checkingProgressPending: { cn: '正由其他页面负责更新', tw: '正由其他頁面負責更新', en: 'Updating by Other Pages' },
    checkingProgressRunning: { cn: '正在获取数据', tw: '正在擷取資料', en: 'Fetching' },
    checkingProgressChecking: { cn: '正在比对结果', tw: '正在比對結果', en: 'Comparing List' },
    checkingProgressRunningFail: { cn: '数据获取出错', tw: '資料擷取出錯', en: 'Error While Fetching' },
    checkingProgressCheckingFail: { cn: '结果比对出错', tw: '結果比對出錯', en: 'Error While Comparing' },
  });

  /**
   * @typedef {{ id: string, type: 'user'|'stock'|'topic'|'unknown', url: string, avatar: string, name: string, description: string }} FollowInfo
   * @param {{ timestamp: number, add: FollowInfo[], lost: FollowInfo[] }}
   */
  const showChangeList = function ({ timestamp, add = [], lost = [], rename = [] }) {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    const followChangeDialog = ui.dialog({
      id: 'yawf-follow-change',
      title: i18n.autoCheckFollowingDialogTitle,
      /** @param {Element} container */
      render(container, { ok: okButton }) {
        okButton.textContent = i18n.autoCheckFollowingConfirmed;
        container.innerHTML = '<div class="yawf-following-notice-header"></div><div class="yawf-following-notice-body"><div class="yawf-following-add" style="display: none;"><div class="yawf-following-add-title"></div><div class="yawf-following-add-items"><ul class="yawf-config-collection-list yawf-config-collection-user-id"></ul></div></div><div class="yawf-following-lost" style="display: none;"><div class="yawf-following-lost-title"></div><div class="yawf-following-lost-items"><ul class="yawf-config-collection-list yawf-config-collection-user-id"></ul></div></div><div class="yawf-following-rename" style="display: none;"><div class="yawf-following-rename-title"></div><div class="yawf-following-rename-items"><ul class="yawf-config-collection-list yawf-config-collection-user-id"></ul></div></div></div><div class="yawf-following-notice-footer"><span class="yawf-following-notice-last-time-text"></span><span class="yawf-following-notice-last-time"></span></div>';
        container.querySelector('.yawf-following-notice-header').textContent = i18n.autoCheckFollowingTip;
        container.querySelector('.yawf-following-add-title').textContent = i18n.autoCheckFollowingAdd;
        container.querySelector('.yawf-following-lost-title').textContent = i18n.autoCheckFollowingLost;
        container.querySelector('.yawf-following-rename-title').textContent = i18n.autoCheckFollowingRename;
        container.querySelector('.yawf-following-notice-last-time-text').textContent = i18n.autoCheckFollowingLastTime;
        container.querySelector('.yawf-following-notice-last-time').textContent = formatLastTime(timestamp);
        [
          { area: container.querySelector('.yawf-following-add'), list: add },
          { area: container.querySelector('.yawf-following-lost'), list: lost },
          { area: container.querySelector('.yawf-following-rename'), list: rename },
        ].forEach(({ area, list }) => {
          if (!list || !Array.isArray(list) || !list.length) return;
          area.style.display = '';
          const ul = area.querySelector('ul');
          list.forEach(item => {
            const wrap = document.createElement('ul');
            wrap.innerHTML = '<li class="yawf-config-collection-item W_btn_b W_btn_tag"><div class="yawf-config-collection-item-content"><div class="yawf-config-user-item"><div class="yawf-config-user-avatar"><img class="yawf-config-user-avatar-img" /></div><div><a class="yawf-config-user-name" target="_blank"></a></div><div><span class="yawf-config-user-detail S_txt2"></span></div></div></div></li>';
            if (item.type === 'user') wrap.querySelector('.yawf-config-user-item').setAttribute('usercard', `id=${item.user}`);
            wrap.querySelector('img').setAttribute('src', item.avatar);
            const name = wrap.querySelector('.yawf-config-user-name');
            name.textContent = item.description;
            name.href = item.url;
            if (item.old) {
              const detail = wrap.querySelector('.yawf-config-user-detail');
              detail.title = detail.textContent = '@' + item.old.name.replace(/@|\s*\(.*\)/g, '');
            }
            const li = wrap.firstChild;
            ul.appendChild(li);
          });
        });
      },
      button: {
        ok() { resolve(true); followChangeDialog.hide(); },
        cancel() { resolve(null); followChangeDialog.hide(); },
      },
    });
    followChangeDialog.show();
    return promise;
  };

  following.autoCheckFollowing = rule.Rule({
    weiboVersion: [6, 7],
    id: 'filter_follow_check',
    version: 1,
    parent: following.following,
    template: () => i18n.autoCheckFollowing,
    ref: {
      frequency: {
        type: 'select',
        initial: 3 * 86400e3,
        select: [
          { text: () => i18n.autoCheckFollowing1, value: 1 * 86400e3 },
          { text: () => i18n.autoCheckFollowing3, value: 3 * 86400e3 },
          { text: () => i18n.autoCheckFollowing7, value: 7 * 86400e3 },
        ],
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.autoCheckFollowingDetail },
      fetching: {
        preparConfig() {
          const { fetchData } = followingContext;
          this.config = fetchData.preparConfig();
          return fetchData;
        },
        render() {
          this.getConfig();
          const buttonArea = document.createElement('span');
          buttonArea.setAttribute('yawf-config-item', this.configId);
          if (yawf.WEIBO_VERSION === 6) {
            buttonArea.innerHTML = '<span class="yawf-following-checking"></span><a href="javascript:;" class="W_btn_b yawf-following-check-now"><span class="W_f14"></span></a>';
          } else {
            buttonArea.innerHTML = '<span class="yawf-following-checking"></span><button class="woo-button-main woo-button-flat woo-button-primary woo-button-s woo-button-round woo-dialog-btn yawf-following-check-now"><span class="woo-button-wrap"><span class="woo-button-content"></span></span></button>';
          }
          const checkNowButton = buttonArea.querySelector('.yawf-following-check-now');
          checkNowButton.addEventListener('click', event => {
            if (!event.isTrusted) return;
            updateFollowList();
          });
          if (yawf.WEIBO_VERSION === 6) {
            checkNowButton.querySelector('span').textContent = i18n.autoCheckFollowingNow;
          } else {
            checkNowButton.querySelector('.woo-button-content').textContent = i18n.autoCheckFollowingNow;
          }
          this.renderValue(buttonArea);
          return buttonArea;
        },
        renderValue(buttonArea) {
          const fetchData = this.getConfig();
          const checkingText = buttonArea.querySelector('.yawf-following-checking');
          const checkNowButton = buttonArea.querySelector('.yawf-following-check-now');
          if (fetchData && fetchData.lock) {
            checkNowButton.style.display = 'none';
            checkingText.style.display = '';
            const progress = {
              status: {
                waiting: i18n.checkingProgressWaiting,
                starting: i18n.checkingProgressStarting,
                inactive: i18n.checkingProgressInactive,
                pending: i18n.checkingProgressPending,
                running: i18n.checkingProgressRunning,
                running_fail: i18n.checkingProgressRunningFail,
                checking: i18n.checkingProgressChecking,
                checking_fail: i18n.checkingProgressCheckingFail,
              }[updateStatus.status],
              total: updateStatus.total,
              current: updateStatus.current,
              result: updateStatus.result,
            };
            const statusText = i18n.checkingProgress.replace(/\{(\w+)\}/g, (_, w) => progress[w]);
            checkingText.textContent = i18n.autoCheckFollowingRunning.replace(/\{1\}/, () => statusText);
          } else {
            checkingText.style.display = 'none';
            checkNowButton.style.display = '';
          }
        },
      },
      buttons: {
        preparConfig() {
          const { lastList } = followingContext;
          this.config = lastList.preparConfig();
          return lastList;
        },
        render() {
          const buttonArea = document.createElement('span');
          buttonArea.setAttribute('yawf-config-item', this.configId);
          if (yawf.WEIBO_VERSION === 6) {
            buttonArea.innerHTML = '<span class="yawf-following-last-text"></span><span class="yawf-following-last-time"></span><a href="javascript:;" class="W_btn_b yawf-following-export" style="margin-left:1em;"><span class="W_f14"></span></a><a href="javascript:;" class="W_btn_b yawf-following-clear" style="margin-left:1em;"><span class="W_f14"></span></a>';
          } else {
            buttonArea.innerHTML = '<span class="yawf-following-last-text"></span><span class="yawf-following-last-time"></span><button class="woo-button-main woo-button-flat woo-button-primary woo-button-s woo-button-round woo-dialog-btn yawf-following-export"><span class="woo-button-wrap"><span class="woo-button-content"></span></span></button><button class="woo-button-main woo-button-flat woo-button-primary woo-button-s woo-button-round woo-dialog-btn yawf-following-clear"><span class="woo-button-wrap"><span class="woo-button-content"></span></span></button>';
          }
          const lastTimeText = buttonArea.querySelector('.yawf-following-last-text');
          const lastTime = buttonArea.querySelector('.yawf-following-last-time');
          const exportButton = buttonArea.querySelector('.yawf-following-export');
          const clearFollowing = buttonArea.querySelector('.yawf-following-clear');
          if (yawf.WEIBO_VERSION === 6) {
            exportButton.querySelector('span').textContent = i18n.autoCheckFollowingDownload;
            clearFollowing.querySelector('span').textContent = i18n.autoCheckFollowingClean;
          } else {
            exportButton.querySelector('.woo-button-content').textContent = i18n.autoCheckFollowingDownload;
            clearFollowing.querySelector('.woo-button-content').textContent = i18n.autoCheckFollowingClean;
          }
          exportButton.addEventListener('click', event => {
            if (!event.isTrusted) return;
            exportFollowList(this.getConfig());
          });
          clearFollowing.addEventListener('click', event => {
            if (!event.isTrusted) return;
            clearFollowList();
          });
          lastTimeText.textContent = i18n.autoCheckFollowingLastTime;
          const lastList = this.getConfig();
          lastTime.textContent = formatLastTime(lastList && lastList.timestamp);
          if (!lastList || !lastList.timestamp) {
            exportButton.style.display = 'none';
            clearFollowing.style.display = 'none';
          }
          return buttonArea;
        },
        renderValue(buttonArea) {
          const lastList = this.getConfig();
          const lastTime = buttonArea.querySelector('.yawf-following-last-time');
          const exportButton = buttonArea.querySelector('.yawf-following-export');
          const clearFollowing = buttonArea.querySelector('.yawf-following-clear');
          lastTime.textContent = formatLastTime(lastList && lastList.timestamp);
          if (!lastList || !lastList.timestamp) {
            exportButton.style.display = 'none';
            clearFollowing.style.display = 'none';
          } else {
            exportButton.style.display = '';
            clearFollowing.style.display = '';
          }
        },
      },
    },
    init() {
      const enabled = this.isEnabled();
      const frequency = this.ref.frequency.getConfig();
      const { fetchData, lastList, lastChange } = followingContext;
      let shouldUpdate = false;
      const fetchContext = fetchData.getConfig();
      const list = lastList.getConfig();
      if (fetchContext.lock) shouldUpdate = true;
      if (enabled && (!list || !list.list)) shouldUpdate = true;
      if (enabled && list && list.timestamp < Date.now() - frequency) shouldUpdate = true;
      if (shouldUpdate) {
        reportUpdateStatus('waiting');
        setTimeout(updateFollowList, 10e3);
      }
      const change = lastChange.getConfig();
      if (change && change.timestamp) {
        if (init.page.type() === 'search') return;
        showChangeList(change).then(confirm => confirm && lastChange.setConfig(null));
      }
    },
  });

  css.append(`
.yawf-WBV6 .yawf-following-add-title,
.yawf-WBV6 .yawf-following-lost-title,
.yawf-WBV6 .yawf-following-rename-title { font-weight: bold; margin: 10px 0 5px; } 
.yawf-WBV6 .yawf-following-notice-header { padding: 20px; }
.yawf-WBV6 .yawf-following-notice-body { padding: 0 20px; width: 600px; max-height: 320px; overflow: auto; } 
.yawf-WBV6 .yawf-following-notice-footer { padding: 20px; } 
.yawf-WBV6 .yawf-following-notice-body a.yawf-config-user-name { color: inherit; }
.yawf-WBV6 .yawf-following-rename .yawf-config-user-name,
.yawf-WBV6 .yawf-following-rename .yawf-config-user-detail { display: inline-block; text-overflow: ellipsis; white-space: nowrap; vertical-align: top; }
.yawf-WBV6 .yawf-config-user-avatar-img { max-width: 50px; max-height: 50px; }
`);

  css.append(`
.yawf-WBV7 #yawf-follow-change .woo-dialog-title { margin-bottom: 0; }
.yawf-WBV7 #yawf-follow-change .woo-dialog-body { padding: 0; }
.yawf-WBV7 .yawf-following-add-title,
.yawf-WBV7 .yawf-following-lost-title,
.yawf-WBV7 .yawf-following-rename-title { font-weight: bold; margin: 10px 0 5px; } 
.yawf-WBV7 .yawf-following-notice-header { padding: 20px; }
.yawf-WBV7 .yawf-following-notice-body { padding: 0 20px; width: 600px; max-height: 320px; overflow: auto; } 
.yawf-WBV7 .yawf-following-notice-footer { padding: 20px; } 
.yawf-WBV7 .yawf-following-notice-body a.yawf-config-user-name { color: inherit; }
.yawf-WBV7 .yawf-following-rename .yawf-config-user-name,
.yawf-WBV7 .yawf-following-rename .yawf-config-user-detail { display: inline-block; text-overflow: ellipsis; white-space: nowrap; vertical-align: top; }
`);

  i18n.uncheckFollowPresenter = {
    cn: '话题页面发布框取消默认勾选关注主持人',
    tw: '話題頁面發佈框取消預設勾選關注主持人',
    en: 'Uncheck follow presenter in topic page',
  };

  following.uncheckFollowPresenter = rule.Rule({
    id: 'uncheck_follow_presenter',
    version: 1,
    parent: following.following,
    template: () => i18n.uncheckFollowPresenter,
    initial: true,
    ainit() {
      observer.dom.add(function uncheckFollowPresenter() {
        const inputs = Array.from(document.querySelectorAll('input[type="checkbox"][checked][action-data*="follow"]:not([yawf-uncheck-follow])'));
        inputs.forEach(checkbox => {
          checkbox.setAttribute('yawf-uncheck', '');
          if (checkbox.checked) checkbox.click();
        });
      });
    },
  });

  i18n.showArticleWithoutFollow = {
    cn: '头条文章不关注作者直接显示全文',
    tw: '頭條文章不關注作者直接顯示全文',
    en: 'Show whole article without follow the author',
  };

  following.showArticleWithoutFollow = rule.Rule({
    id: 'show_article_without_follow',
    version: 1,
    parent: following.following,
    template: () => i18n.showArticleWithoutFollow,
    initial: true,
    ainit() {
      const showArticleCss = `
.WB_editor_iframe, .WB_editor_iframe_new, .WB_editor_iframe_word { height: auto !important; }
.artical_add_box [node-type="maskContent"] { display: none; }
`;
      css.append(showArticleCss);
      observer.dom.add(function articleFrameStyle() {
        /** @type{NodeListOf<HTMLIFrameElement>} */
        const frames = document.querySelectorAll('iframe[src*="ttarticle/p/show"]');
        if (!frames.length) return;
        Array.from(frames).forEach(function injectStyle(frame) {
          const document = frame.contentDocument;
          if (!document) setTimeout(injectStyle, 10, frame);
          const target = document.head || document.body || document.documentElement;
          const style = document.createElement('style');
          style.textContent = showArticleCss;
          target.appendChild(style);
        });
      });
    },
  });

}());
