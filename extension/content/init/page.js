/*
 * 检查当前页面的类型
 */
; (async function () {

  const yawf = window.yawf;
  const init = yawf.init = yawf.init || {};
  const page = init.page = init.page || {};

  switch (true) {
  case location.pathname.startsWith('/nguide'):
    page.type = 'nguide';
    break;
  case location.host === 's.weibo.com':
    page.type = 'search';
    break;
  case location.host === 'd.weibo.com':
    page.type = 'discover';
    break;
  case location.pathname.slice(-5) === '/home':
    page.type = new URLSearchParams(location.search).get('gid') > 0 ? 'group' : 'home';
    break;
  default:
    page.type = null;
  }

}());
