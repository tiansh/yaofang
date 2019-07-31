/**
 * 这个文件用来维护用户信息
 */
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  /** @typedef {{id:number,name:string,avatar:string,followee:number,follower:number}} UserInfo */
  /** @type {Map<number,UserInfo>} */
  const userInfoCacheById = new Map();
  /** @type {Map<string,UserInfo>} */
  const userInfoCacheByName = new Map();
  const baseUrl = new URL({
    userCard: '//weibo.com/aj/v6/user/newcard',
    userCard_abroad: '//www.weibo.com/aj/v6/user/newcard',
  // document.domain 基于 STK.lib.card.usercard.basecard 并非笔误
  }[document.domain === 'www.weibo.com' ? 'userCard_abroad' : 'userCard'], location.href);

  /**
   * @param {{id:number?,name:string?}}
   * @return {UserInfo}
   */
  const userInfo = async function userInfo({ id = null, name = null }) {
    if (!id && !name) throw TypeError('Request userinfo without id or name.');
    if (id && userInfoCacheById.has(id)) {
      return JSON.parse(JSON.stringify(userInfoCacheById.get(id)));
    }
    if (name && userInfoCacheByName.has(name)) {
      return JSON.parse(JSON.stringify(userInfoCacheByName.get(name)));
    }
    const url = new URL(baseUrl);
    url.searchParams.set('type', '1');
    url.searchParams.set('callback', network.fakeCallback());
    if (id) url.searchParams.set('id', id);
    else url.searchParams.set('name', name);
    try {
      util.debug('fetch url %s', url);
      const resp = await network.fetchText(url);
      // 我仍然无法理解一个使用 JSON 包裹 HTML 的 API
      const html = network.parseJson(resp).data;
      const usercard = new DOMParser().parseFromString(html, 'text/html');
      return (function parseUserInfoResponse() {
        const avatar = usercard.querySelector('.pic_box img').src;
        const name = usercard.querySelector('.name a[uid]').getAttribute('title');
        // 虽然一般来说是由数码组成的，但是 $CONFIG.uid 是字符串类型，所以我们遵守微博的类型约定使用字符串类型
        const id = usercard.querySelector('.name a[uid]').getAttribute('uid');
        const followee = util.strings.parseint(usercard.querySelector('.c_follow em').textContent);
        const follower = util.strings.parseint(usercard.querySelector('.c_fans em').textContent);
        const data = { avatar, id, name, followee, follower };
        userInfoCacheById.set(id, data);
        userInfoCacheByName.set(name, data);
        util.debug('Fetch user info get: %o', data);
        return data;
      }());
    } catch (error) {
      // 可能是用户不存在，也可能是其它问题
      util.debug('Fetch user info failed: request %o, error: %o', url, error);
      return null;
    }
  };
  request.userInfo = userInfo;

}());
