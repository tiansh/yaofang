/**
 * 获取投票的详情
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const voteDetail = async function (voteId) {
    const url = new URL('https://vote.weibo.com/h5/index/index');
    url.searchParams.set('vote_id', voteId);
    util.debug('fetch url %s', url);
    const resp = await network.fetchText(url);
    const dom = (new DOMParser()).parseFromString(resp, 'text/html');
    const scripts = dom.querySelectorAll('script:not([src])');
    const data = [...scripts].reduce((data, script) => {
      if (data) return data;
      try {
        const data = JSON.parse(script.textContent.match(/\{[\s\S]*\}/)[0]);
        if (!data.vote_info) return null;
        return data;
      } catch (e) {
        return null;
      }
    }, null);
    return data;
  };

  request.voteDetail = voteDetail;

}());
