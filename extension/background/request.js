; (async function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const requests = [{
    id: 'hotSearch',
    filter: {
      urls: ['*://s.weibo.com/ajax/jsonp/gettopsug*'],
      // types: [],
    },
  }];

  requests.forEach(({ id, filter }) => {
    browser.webRequest.onBeforeRequest.addListener(async details => {
      const { documentUrl, tabId } = details;
      if (!documentUrl) return {};
      if (!/^(?:.*\.)?weibo.com$/.test(new URL(documentUrl).hostname)) return false;
      return message.invoke(tabId).request(id, details).catch(error => ({}));
    }, filter, ['blocking']);
  });

}());
