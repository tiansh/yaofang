; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const time = util.time;

  const pageSize = 10;
  const feedHistoryPage = async function (mid, page) {
    const host = location.hostname === 'www.weibo.com' ? 'www.weibo.com' : 'weibo.com';
    const url = new URL(`https://${host}/p/aj/v6/history?ajwvr=6&domain=100505`);
    url.searchParams.set('mid', mid);
    url.searchParams.set('page', page);
    url.searchParams.set('page_size', pageSize);
    url.searchParams.set('__rnd', Date.now());
    util.debug('fetch url %s', url + '');
    const resp = await network.fetchJson(url + '');
    const data = resp.data;
    const count = data.total_num;
    const dom = new DOMParser().parseFromString(data.html, 'text/html');
    const historyList = [...dom.querySelectorAll('.WB_feed_detail')].map(history => {
      const from = history.querySelector('.WB_from');
      const date = time.parse(from.querySelector('a').textContent.trim());
      from.remove();
      const text = history.querySelector('.WB_text');
      // 我也不知道为什么末尾有一个零宽空格，而且零宽空格前还可能有空格
      const source = text.textContent.replace(/^[\s]*|[\s\u200b]*$/g, '');
      text.textContent = source;
      const imgs = Array.from(history.querySelectorAll('.WB_pic img'));
      if (imgs.length) {
        const old = history.querySelector('.WB_media_wrap');
        const media = document.createElement('div');
        media.innerHTML = '<div class="WB_media_wrap clearfix"><div class="media_box"><ul class="WB_media_a clearfix"><li class="WB_pic S_bg1 S_line2" action-type="fl_pics"></li></ul></div></div>';
        const ul = media.querySelector('ul');
        const li = ul.removeChild(ul.firstChild);
        ul.classList.add('WB_media_a_m' + imgs.length);
        if (imgs.length > 1) ul.classList.add('WB_media_a_mn');
        imgs.forEach((img, index) => {
          const container = li.cloneNode(true);
          container.classList.add('li_' + (index + 1));
          container.appendChild(img);
          const actionData = new URLSearchParams('isPrivate=0&relation=0');
          actionData.set('pic_id', img.src.replace(/^.*\/|\..*$/g, ''));
          container.setAttribute('action-data', actionData);
          ul.appendChild(container);
        });
        old.replaceWith(media.firstChild);
      }
      return { date, dom: history, text: source, imgs };
    });
    return { count, list: historyList };
  };

  const feedHistory = async function (mid) {
    const { count, list } = await feedHistoryPage(mid, 1);
    const pages = Math.ceil(count / pageSize);
    for (let i = 2; i <= pages; i++) {
      const data = await feedHistoryPage(mid, i);
      list.push(...data.list);
    }
    list.forEach((item, index) => {
      item.index = list.length - index;
    });
    return list;
  };
  request.feedHistory = feedHistory;

}());
