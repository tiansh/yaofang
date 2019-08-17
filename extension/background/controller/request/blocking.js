; (function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const requests = [{
    id: 'hotSearch',
    filter: {
      urls: ['*://s.weibo.com/ajax/jsonp/gettopsug*'],
    },
  }, {
    id: 'ads',
    filter: {
      urls: [
        '*://*.alitui.weibo.com/*',
        '*://*.biz.weibo.com/*',
        '*://*.uve.weibo.com/*',
      ],
    },
  }, {
    id: 'tracker',
    filter: {
      urls: [
        '*://*.beacon.sina.com.cn/*',
        '*://*.sbeacon.sina.com.cn/*',
        '*://*.rs.sinajs.cn/*.gif*',
        '*://j.s.weibo.com/doit.png*',
        '*://*.doubleclick.net/*',
        '*://js.t.sinajs.cn/t5/home/js/common/extra/exposure.js*',
        '*://js.t.sinajs.cn/open/analytics/js/suda.js*',
      ],
    },
  }, {
    id: 'topic',
    filter: {
      urls: [
        '*://weibo.com/aj/mblog/topic*',
        '*://*.weibo.com/aj/mblog/topic*',
      ],
    },
  }];

  requests.forEach(({ id, filter }) => {
    browser.webRequest.onBeforeRequest.addListener(async details => {
      try {
        const { documentUrl, tabId } = details;
        if (!new URL(documentUrl).hostname.endsWith('weibo.com')) return {};
        const contentResponse = await message.invoke(tabId).request(id, details);
        return contentResponse;
      } catch (error) { console.error(error); }
      return {};
    }, filter, ['blocking']);
  });

}());
