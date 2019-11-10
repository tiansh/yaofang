/*
 * 检查当前页面的类型
 */
; (function () {

  const yawf = window.yawf;
  const init = yawf.init = yawf.init || {};
  const page = init.page = init.page || {};

  page.type = function () {
    const search = new URLSearchParams(location.search);
    // 导览页面
    if (location.pathname.startsWith('/nguide')) return 'nguide';
    // 搜索页面
    if (location.host === 's.weibo.com') return 'search';
    // 发现页面
    if (location.host === 'd.weibo.com') return 'discover';
    // 头条文章
    if (/\/ttarticle\//.test(location.pathname)) return 'ttarticle';
    const $CONFIG = page.$CONFIG; if (!$CONFIG) return null;
    if ($CONFIG.bpType === 'page') {
      // 地点
      if ($CONFIG.domain === '100101') return 'place';
      // 电影
      if ($CONFIG.domain === '100120') return 'movie';
      // 图书
      if ($CONFIG.domain === '100202') return 'book';
      // 个人主页
      if ($CONFIG.domain === '100505') return 'profile';
      // 话题页（超话）
      if ($CONFIG.domain === '100808') return 'topic';
      // 音乐
      if ($CONFIG.domain === '101515') return 'music';
      // 股票
      if ($CONFIG.domain === '230677') return 'stock';
    }
    if ($CONFIG.bpType === 'main') {
      // 赞
      if (location.pathname.startsWith('/like/outbox')) return 'like';
      // 收藏
      if (location.pathname.startsWith('/fav')) return 'fav';
      // 首页
      if (/\/home$/.test(location.pathname)) {
        if (search.get('gid') > 0) return 'group';
        return 'home';
      }
      // 好友圈
      if (location.pathname.startsWith('/friends')) return 'friends';
    }
    // Unknown
    return null;
  };

}());
