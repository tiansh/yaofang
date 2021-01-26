; (function () {

  const browser = window.weBrowser;
  const yawf = window.yawf;
  const message = yawf.message;

  /**
   * 将 https://chat.221edc3f-9e16-4973-a522-4ca21e7c8540.invalid/
   * 重定向到 /external/chatframe/index.html
   *
   * 这样做是为了避免将扩展的域名暴露给微博网页。
   * Firefox 扩展的域名是用户安装时随机决定的，如果暴露给网站，网站可以用来追踪用户。
   * 所以 MDN 上建议一般不要将这个域名暴露给网站。
   * 如果直接用 iframe 指向扩展的页面，会导致网站可以通过读取 iframe 的 src 得到扩展的域名。
   * 这里将 iframe 指向一个固定的域名，然后重定向到扩展的域名。这样微博的网页将只能看到这个固定的域名。
   */
  browser.webRequest.onBeforeRequest.addListener(details => {
    const redirectUrl = browser.runtime.getURL('/external/chatframe/index.html');
    return { redirectUrl };
  }, {
    urls: ['https://chat.221edc3f-9e16-4973-a522-4ca21e7c8540.invalid/'],
    types: ['sub_frame'],
  }, ['blocking']);

  const chatTabByWindow = new Map();

  const chatToUid = function chatToUid(uid) {
    const sender = this;
    const tabId = chatTabByWindow.get(sender.tab.windowId);
    if (!tabId) setTimeout(() => {
      chatToUid.call(this, uid);
    }, 10); else {
      message.invoke(tabId).chatToUid(uid);
    }
  };
  message.export(chatToUid);

  const chatReady = function chatReady() {
    const sender = this;
    chatTabByWindow.set(sender.tab.windowId, sender.tab.id);
  };
  message.export(chatReady);

  browser.tabs.onRemoved.addListener(function (tabId, info) {
    chatTabByWindow.delete(info.windowId);
  });

}());
