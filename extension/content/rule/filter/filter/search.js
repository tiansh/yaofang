; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const init = yawf.init;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;

  i18n.feedsSearchTitle = {
    cn: '搜索页面',
    tw: '搜尋頁面',
    en: 'Search',
  };

  const search = filter.search = {};
  search.search = rule.Group({
    parent: filter.filter,
    template: () => i18n.feedsSearchTitle,
  });

  i18n.searchInHomepage = {
    cn: '使用首页代替搜索页面',
    tw: '使用首頁代替搜索頁面',
    en: 'Use home page for search',
  };

  search.searchInHomepage = rule.Rule({
    id: 'filter_search_in_home_page',
    version: 1,
    parent: search.search,
    template: () => i18n.searchInHomepage,
    ainit() {
      if (init.page.type() !== 'search') return;
      const [pathType, pathWord] = location.pathname.slice(1).split('/');
      const type = ['user', 'article', 'video', 'pic', 'topic'].find(t => pathType === t) || 'weibo';
      if (type === 'user') return;
      const word = new URLSearchParams(location.search).get('q') || pathWord || '';
      const url = new URL('https://weibo.com/home?gid=-3&is_search=1');
      url.searchParams.set('key_word', word);
      if (type !== 'weibo') url.searchParams.set('is_' + type, 1);
      window.stop();
      location.replace(url);
    },
  });

}());
