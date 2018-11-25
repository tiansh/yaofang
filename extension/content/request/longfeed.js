/**
 * 找到一条超长微博的全文
 */
; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  // 这一次我们不再缓存长微博的原文了，因为现在微博神他妈可以编辑了
  const getLongText = async function (mid) {
    const requestUrl = new URL('https://weibo.com/p/aj/mblog/getlongtext');
    requestUrl.searchParams.set('ajwvr', 6);
    requestUrl.searchParams.set('mid', mid);
    requestUrl.searchParams.set('__rnd', +new Date());
    const resp = await fetch(requestUrl, { credentials: 'include' }).then(r => r.json());
    const { html } = (resp || {}).data || {}; if (!html) return null;
    util.debug('Got longtext for %o: %o', mid, html);
    return html;
  };
  request.getLongText = getLongText;

}());
