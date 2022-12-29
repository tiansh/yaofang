; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request ?? {};

  const getFollowingPage = async function (uid, page) {
    const url = `https://weibo.com/ajax/friendships/friends?page=${page ?? 1}&uid=${uid}`;
    util.debug('Fetch Follow: fetch page %s', url);
    util.debug('fetch url %s', url);
    const resp = await network.fetchJson(url);
    if (!resp || !Array.isArray(resp.users) || !resp.users.length) {
      return {
        allPages: [],
        followInPage: [],
      };
    }
    const pages = resp.next_cursor ? Math.ceil(resp.total_number / (resp.next_cursor - resp.previous_cursor)) : page;
    const allPages = Array.from(Array(pages)).map((_, i) => i + 1);
    // V7 的关注列表现在只能看到用户
    const followInPage = resp.users.map(user => {
      return {
        id: `user-${user.idstr}`,
        type: 'user',
        user: user.idstr,
        url: new URL(user.profile_url, 'https://weibo.com/').href,
        avatar: user.avatar_large,
        name: user.screen_name,
        description: '@' + user.screen_name,
      };
    });
    util.debug('Fetch follow: got %o in page', followInPage.length);
    return { allPages, followInPage };
  };

  request.getFollowingPage = async function (uid, page = null) {
    for (let attempt = 0; attempt < 16; attempt++) {
      if (attempt !== 0) {
        util.debug('Retry fetching user following data; attempt %d', attempt + 1);
      }
      try {
        return await getFollowingPage(uid, page);
      } catch (e) {
        util.debug('Error while fetching user following data: %o', e);
        await new Promise(resolve => { setTimeout(resolve, 30e3 * Math.min(8, attempt)); });
      }
    }
    util.debug('Aborted fetching user following data, too many failed attempts.');
    throw Error('Network error while fetching following data');
  };

}());
