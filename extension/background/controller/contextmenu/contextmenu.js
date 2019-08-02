/**
 * 处理浏览器右键菜单
 */
; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const message = yawf.message;
  const browserInfo = yawf.browserInfo;

  const contextMenuCheckSupport = function contextMenuCheckSupport() {
    try {
      if (typeof browser.menus.onShown.addListener !== 'function') return false;
      if (typeof browser.menus.onHidden.addListener !== 'function') return false;
    } catch (e) { return false; }
    return true;
  };

  message.export(contextMenuCheckSupport);

  if (!contextMenuCheckSupport()) return;

  const menuTitleWithAccessKey = (function () {
    if (browserInfo.name === 'Firefox' && browserInfo.majorVersion < 63) {
      // 火狐 63 以前的版本不支持 accessKey 设置
      return function (title) { return title; };
    }
    /**
     * @param {string} title
     * @param {string} accessKey
     */
    return function (title, accessKey = null) {
      let key = null;
      if (accessKey && /^[0-9A-Za-z]/.test(accessKey)) {
        key = accessKey.toUpperCase();
      }
      const fixedTitle = title.replace(/./g, c => {
        if (c === '&') return '&&';
        if (c.toUpperCase() === key) {
          key = null;
          return '&' + c;
        }
        return c;
      });
      if (key) return fixedTitle + ` (&${key})`;
      else return fixedTitle;
    };
  }());

  let lastContextMenuIndex = 0, lastContextMenuClicked = false;
  browser.menus.onShown.addListener(async info => {
    if (!info.contexts.includes('all')) return;
    const contextMenuIndex = ++lastContextMenuIndex;
    lastContextMenuClicked = false;
    const items = await message.invoke().contextMenuShow().catch(() => []);
    if (contextMenuIndex !== lastContextMenuIndex) return;
    if (!Array.isArray(items) || !items.length) return;
    browser.menus.removeAll();
    const rootMenu = browser.menus.create({
      title: menuTitleWithAccessKey(browser.i18n.getMessage('extensionName'), env.config.contextMenuKey),
    });
    items.forEach(({ title, accessKey = null, data }) => {
      browser.menus.create({
        parentId: rootMenu,
        title: menuTitleWithAccessKey(title, accessKey),
        onclick: function () {
          lastContextMenuClicked = true;
          message.invoke().contextMenuClicked(data);
        },
      });
    });
    browser.menus.refresh();
  });

  browser.menus.onHidden.addListener(async () => {
    browser.menus.removeAll();
    await Promise.resolve();
    ++lastContextMenuIndex;
    if (!lastContextMenuClicked) {
      message.invoke().contextMenuHidden();
    }
  });

}());
