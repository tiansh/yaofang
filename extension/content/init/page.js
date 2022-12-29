/*
 * 检查当前页面的类型
 */
; (function () {

  const yawf = window.yawf;
  const init = yawf.init = yawf.init ?? {};

  const page = init.page = init.page ?? {};

  page.route = null;
  page.update = function (route) {
    page.route = route;
  };
  page.type = function () {
    if (location.pathname.startsWith('/tv/')) return 'tv';
    const route = page.route;
    if (route.name === 'profile') return 'profile';
    if (route.name === 'like') return 'like';
    if (route.name === 'collect') return 'fav';
    if (route.name === 'mygroups') {
      // 最新微博
      if (/^11000/.test(route.query.gid)) return 'home';
      // 分组
      return 'group';
    }
    if (route.name === 'weibo') {
      const channel = route.meta?.channel;
      // 热门
      if (channel === 'hot') return 'discover';
      // 首页
      if (channel === 'home') return 'home';
    }
    if (route.channel === 'sweiboDefault') return 'search';
    if (route.channel === 'sweibo') return 'search';
    if (route.channel === 'suserDefault') return 'search';
    return null;
  };
  page.oid = function () {
    const route = page.route;
    return route.name === 'profile' ? route.params.id : null;
  };
  page.uid = function () {
    return page.config.user.idstr;
  };

}());
