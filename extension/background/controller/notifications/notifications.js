/**
 * 处理桌面提示
 */
; (async function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const pendingNotification = new Map();

  const showNotifications = async function showNotifications({ title, content, icon, duration }) {
    const sender = this;
    const id = await browser.notifications.create(null, { type: 'basic', title, message: content, iconUrl: icon });
    let resolve = null;
    const result = new Promise(r => { resolve = r; });
    pendingNotification.set(id, { duration, resolve, windowId: sender.tab.windowId, tabId: sender.tab.id });
    return result;
  };
  message.export(showNotifications);

  browser.notifications.onShown.addListener(id => {
    const data = pendingNotification.get(id);
    if (!data) return;
    const { duration } = data;
    if (duration === Infinity) return;
    const when = Date.now() + (+duration || 4000);
    browser.alarms.create(`notification-timeout-${id}`, { when });
  });

  const resolveNotification = async function (id, result) {
    const data = pendingNotification.get(id);
    if (!data) return;
    const { resolve } = data;
    await browser.notifications.clear(id);
    resolve(result);
    pendingNotification.delete(id);
  };

  browser.alarms.onAlarm.addListener(({ name }) => {
    const prefix = 'notification-timeout-';
    if (!name.startsWith(prefix)) return;
    const id = name.slice(prefix.length);
    resolveNotification(id, false);
  });

  browser.notifications.onClosed.addListener(id => {
    resolveNotification(id, false);
  });

  browser.notifications.onClicked.addListener(id => {
    const data = pendingNotification.get(id);
    if (data) {
      const { windowId, tabId } = data;
      browser.windows.update(windowId, { focused: true });
      browser.tabs.update(tabId, { active: true });
    }
    resolveNotification(id, true);
  });

}());
