/**
 * 当输入话题时，给出一个话题列表以供选择
 */
; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request || {};

  const topicSuggest = async function (key) {
    const requestUrl = new URL('https://weibo.com/aj/mblog/topic?');
    requestUrl.searchParams.set('ajwvr', 6);
    requestUrl.searchParams.set('q', key);
    requestUrl.searchParams.set('__rnd', +new Date());
    const resp = await fetch(requestUrl, { credentials: 'include' }).then(r => r.json());
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
