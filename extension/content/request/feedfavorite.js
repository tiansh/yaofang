/**
 * 收藏一条微博
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const strings = util.strings;

  const feedFavorite = function (feed, { $CONFIG }) {
    const mid = feed.getAttribute('mid');
    const url = String(new URL('/aj/fav/mblog/add?ajwvr=6', location.href));
    const body = String(new URLSearchParams([
      ['mid', mid],
      ...new URLSearchParams(feed.getAttribute('data-mark')),
      ['location', $CONFIG.location],
      ...new URLSearchParams(feed.getAttribute('diss-data')),
    ]));
    util.debug('fetch url %s\nPOST\n%s', url, body);
    return new Promise(resolve => {
      const key = 'feed_favorite_' + strings.randKey();
      const listener = function (event) {
        event.stopPropagation();
        const success = event.detail.success === 'true';
        window.removeEventListener(key, listener, true);
        resolve(success);
      };
      window.addEventListener(key, listener, true);
      util.inject(function ({ url, body }, key) {
        let success = false;
        ; (async function () {
          try {
            const resp = await fetch(url, {
              method: 'POST',
              body,
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }).then(resp => resp.json());
            success = resp.code === '100000';
          } catch (e) { alert(e); console.log(e); }
          const event = new CustomEvent(key, {
            detail: { success: JSON.stringify(success) },
          });
          window.dispatchEvent(event);
        }());
      }, { url, body }, key);
    });
  };
  request.feedFavorite = feedFavorite;

}());
