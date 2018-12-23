; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const filter = yawf.filter;
  const observer = yawf.observer;
  const request = yawf.request;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;

  Object.assign(i18n, {
    feedsHomepageGroupTitle: {
      cn: '首页',
      tw: '首頁',
      en: 'Homepage',
    },
    feedsHomepageMultiGroup: {
      cn: '使用分组页代替首页（首页微博时间顺序排列）||每次展示{{count}}条|点击查看更多时{{more}}||分组{{groups}}',
      tw: '使用分組頁代替首頁（首頁微博時間順序排列）||每次展示{{count}}條|點擊查看更多時{{more}}||分組{{groups}}',
      en: 'Use feed list by groups for home page (home page timeline order)||show {{count}} feeds per page|{{more}} before show next page||Groups{{groups}}',
    },
    feedsHomepageKeepOld: {
      cn: '保留已展示微博',
      en: 'keep shown feeds',
    },
    feedsHomepageCleanOld: {
      cn: '清空已展示微博',
      en: 'clean up shown feeds',
    },
    feedsHomePageDoneGroup: {
      cn: '分组 {1} 的最近微博已全部展示',
      tw: '分組 {1} 的最近微博已全部展示',
      en: 'All recent feeds from group {1} had been shown',
    },
    feedsMultiGroupLoading: {
      cn: '正在加载……',
      tw: '正在載入……',
      en: 'Loading ...',
    },
    feedsMultiGroupLoadMore: {
      cn: '查看更多微博',
      en: 'Show more feeds',
    },
  });

  const homepage = feeds.homepage = {};
  homepage.homepage = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedsHomepageGroupTitle,
  });

  homepage.multi_group = rule.Rule({
    id: 'multi_group',
    parent: homepage.homepage,
    template: () => i18n.feedsHomepageMultiGroup,
    ref: {
      count: {
        type: 'range',
        min: 20,
        max: 200,
        initial: 50,
        step: 10,
      },
      more: {
        type: 'select',
        select: [
          { value: 'keep', text: () => i18n.feedsHomepageKeepOld },
          { value: 'clear', text: () => i18n.feedsHomepageCleanOld },
        ],
        initial: 'clear',
      },
      groups: {
        type: 'groups',
      },
    },
    ainit() {
      const rule = this;
      const count = rule.ref.count.getConfig();
      const groups = rule.ref.groups.getConfig().slice(0);
      const clear = rule.ref.more.getConfig() === 'clear';

      if (groups.length === 0) return;

      const updateLocation = function updateLocation() {
        const isHomeFeed = document.getElementById('v6_pl_content_homefeed');
        const notHomeFeed = document.getElementById('v6_pl_content_commentlist') ||
          document.querySelector('[id^="Pl_Official_MyProfileFeed__"]');
        if (!isHomeFeed && !notHomeFeed) return;
        const url = new URL(location.href);
        const hasGid = Boolean(+url.searchParams.get('gid'));
        const isSearch = Boolean(+url.searchParams.get('is_search'));
        const isSpecial = ['isfriends', 'vplus', 'isfriends', 'isgroupsfeed', 'whisper']
          .some(key => +url.searchParams.get(key));
        const isCustomGid = hasGid && url.searchParams.get('gid') < 0;
        const requireGid = isHomeFeed && !isSearch && !isSpecial;
        const shouldRemoveGid = notHomeFeed && isCustomGid;
        const incorrectGid = isCustomGid && groups.length === 1;
        if ((!hasGid || incorrectGid) && requireGid) {
          if (groups.length > 1) {
            url.searchParams.set('gid', 1);
          } else if (groups[0].id.startsWith('g')) {
            url.searchParams.set('gid', groups[0].id.slice(1));
          } else if (groups[0].id === 'whisper') {
            url.searchParams.delete('gid');
            url.searchParams.set('whisper', 1);
          }
          location.replace(url.href);
        } else if (hasGid && shouldRemoveGid) {
          url.searchParams.delete('gid');
          location.replace(url);
        }
      };
      observer.add(updateLocation);

      const updateHomeLinksWithGid = function updateHomeLinksWithGid() {
        /** @type {HTMLAnchorElement[]} */
        const links = Array.from(document.querySelectorAll([
          '.gn_logo a', // 导航栏logo
          'a[suda-uatrack*="homepage"]', // 首页链接，根据跟踪标识识别；适用于顶栏和左栏
          '#v6_pl_content_homefeed a[action-type="search_type"][action-data="type=0"]', // 首页消息流顶部的“全部”链接
        ].map(selector => selector + ':not([href*="is_search"])').join(',')));
        links.forEach(link => {
          const url = new URL(link.href);
          const gid = groups.length > 1 ? -2 : groups[0];
          url.searchParams.set('gid', gid);
          link.href = url.href;
        });
      };
      observer.add(updateHomeLinksWithGid);

      // 检查当前页面是否需要启用分组拼凑首页功能
      const checkPage = function checkMultiGroupPage() {
        const query = new URLSearchParams(location.search);
        const gid = +query.get('gid');
        if (gid !== -2) return;
        if (!Array.isArray(groups)) return;
        if (groups.length < 2) return;
        query.delete('gid');
        observer.add(function multiGroupPageFix() {
          watchFeedList(query);
          watchMembers();
        });
      };

      const getLoadingTip = function () {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2"><div class="WB_empty WB_empty_narrow"><div class="WB_innerwrap"><div class="empty_con clearfix"><p class="text"><i class="W_loading"></i></p></div></div></div></div>';
        container.querySelector('.text').appendChild(document.createTextNode(i18n.feedsMultiGroupLoading));
        return container.firstChild;
      };
      const getShowMore = function () {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2 yawf-multiGroupMore"><a class="WB_cardmore WB_cardmore_noborder clearfix" href="javascript:;"><span class="more_txt W_f14"><em class="W_ficon ficon_arrow_down">c</em></span></a></div>';
        const textContainer = container.querySelector('span');
        textContainer.insertBefore(document.createTextNode(i18n.feedsMultiGroupLoadMore), textContainer.firstChild);
        return container.firstChild;
      };

      // 找到消息流的容器，并初始化好它
      const watchFeedList = function (query) {
        const placeholder = document.querySelector('.WB_feed > .WB_result_null');
        if (!placeholder) return;
        let feedlist = placeholder.parentElement;
        feedlist.removeChild(placeholder);
        feedlist.classList.add('WB_feed_v3', 'WB_feed_v4');
        const loading = getLoadingTip();
        feedlist.appendChild(loading);
        const showmore = getShowMore();
        showmore.style.display = 'none';
        feedlist.appendChild(showmore);

        showFeeds(groups, query, { feedlist, loading, showmore });
      };

      // 下掉边栏组内用户的组件
      const watchMembers = function () {
        const members = document.getElementById('v6_pl_rightmod_groups');
        if (members) members.parentNode.removeChild(members);
      };

      // 初始化拼凑首页的逻辑
      const showFeeds = function (groups, query, dom) {
        const getter = request.feedsByGroups(groups, query);
        showMoreFeeds(getter, count, dom);
      };

      // 一条一条往消息流里面塞内容
      const showMoreFeeds = async function (getter, remain, dom) {
        const hasNext = await getter.hasNext();
        if (!hasNext) {
          everythingDone(dom);
          return;
        }
        if (remain === 0) {
          await waitShowMore(dom);
          remain = count;
        }
        const feed = await getter.next();
        if (feed.type === 'feed') {
          renderFeed(feed.dom, dom);
          await new Promise(resolve => setTimeout(resolve, 100));
          remain--;
        } else {
          renderDone(feed.group, dom);
        }
        showMoreFeeds(getter, remain, dom);
      };

      // 完成一组显示后等用户的操作再继续
      const waitShowMore = async function ({ feedlist, loading, showmore }) {
        loading.style.display = 'none';
        showmore.style.display = 'block';
        await new Promise(resolve => {
          const listener = () => {
            showmore.removeEventListener('click', listener);
            resolve();
          };
          showmore.addEventListener('click', listener);
        });
        loading.style.display = 'block';
        showmore.style.display = 'none';
        if (clear) {
          const nav = document.querySelector('.WB_global_nav');
          const navBottom = nav.clientTop + nav.clientHeight;
          const feedlistTop = feedlist.parentNode.offsetTop;
          const margin = 10;
          document.documentElement.scrollTop = feedlistTop - (navBottom + margin);
          while (feedlist.firstChild !== loading) {
            feedlist.removeChild(feedlist.firstChild);
          }
        }
      };

      // 显示一条消息
      const renderFeed = function (feed, { feedlist, loading }) {
        feedlist.insertBefore(feed, loading);
      };

      // 完成一个分组的加载
      const renderDone = function (group, { feedlist, loading }) {
        const container = document.createElement('div');
        container.innerHTML = '<div class="WB_cardwrap S_bg2 yawf-multiGroupDone"><div class="WB_cardtitle_a W_tc yawf-multiGroupDoneTitle"></div></div>';
        const titleContainer = container.querySelector('.yawf-multiGroupDoneTitle');
        const [textBefore, textAfter] = i18n.feedsHomePageDoneGroup.split('{1}');
        titleContainer.appendChild(document.createTextNode(textBefore));
        const groupNameContainer = titleContainer.appendChild(document.createElement('span'));
        titleContainer.appendChild(document.createTextNode(textAfter));
        request.groupList().then(groupList => {
          const gotGroup = groupList.find(({ id }) => id === group.id);
          if (gotGroup) groupNameContainer.textContent = gotGroup.name;
        });
        feedlist.insertBefore(container, loading);
      };

      // 所有分组都完成加载
      const everythingDone = function ({ feedlist, loading, showmore }) {
        feedlist.removeChild(loading);
        feedlist.removeChild(showmore);
      };

      checkPage();

    },
  });


}());
