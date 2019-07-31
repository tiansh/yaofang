/**
 * 当输入话题时，给出一个话题列表以供选择
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const topicSuggest = async function (key) {
    const url = new URL('https://weibo.com/aj/mblog/topic?');
    url.searchParams.set('ajwvr', 6);
    url.searchParams.set('q', key);
    url.searchParams.set('__rnd', +new Date());
    util.debug('fetch url %s', url);
    const resp = await network.fetchJson(url);
    const topics = new Set(Array.from(resp.data).map(({ topic }) => {
      topic = topic.replace(/\[超话\]$/, '');
      if (/\[.*\]/.test(topic)) return null;
      return topic;
    }).filter(topic => topic));
    const result = [...topics];
    util.debug('Got suggestion topics for %o from top: %o', key, result);
    return result;
  };
  request.topicSuggest = topicSuggest;

}());
