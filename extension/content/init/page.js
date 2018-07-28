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
      const gid = new URLSearchParams(location.search).get('gid');
      if (gid > 0) page.type = 'group';
      page.type = 'home';
    default:
      page.type = null;
  }

}());
