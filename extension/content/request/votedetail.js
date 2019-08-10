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
    const script = dom.querySelector('head script').textContent;
    const data = JSON.parse(script.match(/\{[\s\S]*\}/)[0]);
    return data;
  };

  request.voteDetail = voteDetail;

}());
