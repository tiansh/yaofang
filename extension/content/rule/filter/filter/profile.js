; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const filter = yawf.rules.filter;

  const i18n = util.i18n;

  i18n.feedsProfileGroupTitle = {
    cn: '用户主页',
    tw: '用戶主頁',
    en: 'Profile',
  };

  const profile = filter.homepage = {};
  profile.profile = rule.Group({
    parent: filter.filter,
    template: () => i18n.feedsProfileGroupTitle,
  });

  i18n.profileShowAll = {
    cn: '用户主页默认显示全部微博而非热门微博',
    tw: '用戶主頁默認顯示全部微博而非热门微博',
    en: 'Personal page show all Weibo instead of hot by default',
  };

  profile.profileShowAll = rule.Rule({
    id: 'filter_profile_show_all',
    version: 1,
    parent: profile.profile,
    template: () => i18n.profileShowAll,
    ainit() {
      observer.dom.add(function redirectPersionalWeiboRedirect() {
        const profileNav = document.querySelector('[id^="Pl_Official_ProfileFeedNav"]');
        if (!profileNav) return;
        const hotButton = profileNav.querySelector('li[action-type="search_type"][action-data*="is_hot=1"]:not([action-data*="yawf_notall=1"])');
        if (hotButton) hotButton.setAttribute('action-data', hotButton.getAttribute('action-data') + '&yawf_notall=1');
        const search = new URLSearchParams(location.search);
        if (search.get('is_hot') === '1' && search.get('yawf_notall') !== '1') {
          const all = profileNav.querySelector('li[action-type="search_type"][action-data*="is_all=1"]');
          const url = new URL('#_0', location.href);
          url.search = all.getAttribute('action-data');
          history.pushState('YAWF_' + new Date().getTime() + '_' + (Math.random() + '').slice(2), null, url.href);
          all.click();
        }
      });
      observer.dom.add(function updateUserLinksWithIsAll() {
        const links = Array.from(document.querySelectorAll([
          'a[usercard]', // 一般的用户链接
          '.WB_face a', // 微博用户头像（usercard加在链接里面的图片上了）
          '.pic_box a[suda-uatrack*="user_pic"]', // 单条微博上方的用户
          '.WB_artical .main_editor .authorinfo a', // 头条文章的作者信息
          '.webim_chat_window .chat_title a[node-type="_chatUserName"]', // 聊天窗口上的用户名
        ].map(x => x + '[href]:not([href*="is_all"])').join(',')));
        links.forEach(function (l) {
          const search = new URLSearchParams(l.search);
          search.set('is_all', 1);
          l.search = search;
        });
      });
    },
  });

}());
