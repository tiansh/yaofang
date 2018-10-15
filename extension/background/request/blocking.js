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
      return message.invoke(tabId).request(id, details).catch(error => ({}));
    }, filter, ['blocking']);
  });

}());
