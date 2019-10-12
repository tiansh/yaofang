; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const time = util.time;

  const getAllImages = async function (mid) {
    const host = location.hostname;
    const url = new URL(`https://${host}/p/aj/v6/history?ajwvr=6&domain=100505`);
    url.searchParams.set('mid', mid);
    url.searchParams.set('page', 1);
    url.searchParams.set('page_size', 1);
    url.searchParams.set('__rnd', Date.now());
    util.debug('fetch url %s', url + '');
    const resp = await network.fetchJson(url + '');
    const data = resp.data;
    const dom = new DOMParser().parseFromString(data.html, 'text/html');
    const history = dom.querySelector('.WB_feed_detail');
    const imgs = Array.from(history.querySelectorAll('.WB_pic img'));
    return imgs.map(img => img.src.replace(/^https:/, ''));
  };
  request.getAllImages = getAllImages;

}());
