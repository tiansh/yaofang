; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const catched = f => function (...args) {
    try {
      return f.call(this, ...args);
    } catch (e) {
      util.debug(e); return null;
    }
  };

  const getFollowingPage = async function (uid, pageUrl) {
    const url = pageUrl || `https://weibo.com/${uid}/myfollow`;
    util.debug('Fetch Follow: fetch page %s', url);
    util.debug('fetch url %s', url);
    const resp = await network.fetchText(url);
    const re = /<script>FM\.view\({"ns":"pl\.relation\.myFollow\.index".*"html":(?=.*(?:member_box|WB_empty))(".*")}\)<\/script>\n/;
    const dom = util.dom.content(document.createElement('div'), JSON.parse(resp.match(re)[1]));

    // 如果在获取过程中用户手动取消了一些关注，可能导致最后几页是空白的
    // 其实看到这种情况就说明出问题了
    const empty = dom.querySelector('.WB_empty');
    if (empty) {
      return {
        allPages: [],
        followInPage: [],
      };
    }

    const allPages = (function () {
      try {
        const urlTemplate = dom.querySelector('.W_pages a.page[href]').href;
        const pageLinks = dom.querySelectorAll('.W_pages .page');
        const pageCount = Number(pageLinks[pageLinks.length - 2].textContent) || 1;

        return Array.from(Array(pageCount)).map((_, index) => {
          return urlTemplate.replace(/_page=\d+/, '_page=' + (index + 1));
        });
      } catch (e) {
        // only one page
      }
      return [url];
    }());

    const followItem = Array.from(dom.querySelectorAll('.member_box .member_wrap .mod_pic .pic_box a > img'));
    const followInPage = followItem.map(img => {
      const title = img.title;
      const avatar = new URL(img.src, 'https://weibo.com').href;
      return (catched(function () {
        // 关注了一个用户
        const id = new URLSearchParams(img.getAttribute('usercard') || '').get('id');
        if (!id) return null;
        const href = `https://weibo.com/u/${id}`;
        const name = img.getAttribute('alt');
        const description = name !== title ? `@${name} (${title})` : '@' + name;
        return {
          id: `user-${id}`,
          type: 'user',
          user: id,
          url: href,
          avatar,
          name,
          description,
        };
      })()) || (catched(function () {
        // 关注了一支股票
        const id = (img.parentNode.href.match(/weibo.com\/p\/230677([a-zA-Z\d]+)/) || [])[1];
        if (!id) return null;
        const href = `https://weibo.com/p/230677${id}`;
        const description = `$${title}$`;
        return {
          id: 'stock-' + id,
          type: 'stock',
          stock: id,
          url: href,
          avatar: avatar,
          name: description,
          description,
        };
      })()) || (catched(function () {
        // 关注了一个话题
        const ref = img.parentNode.href.match(/huati.weibo.com/);
        if (!ref) return null;
        // 原本的链接包含的是编号，这里换成话题文本，因为话题文本比编号更固定：编号可以被删除，文本无法修改
        const href = `https://weibo.com/k/${title}`;
        const description = `#${title}#`;
        return {
          id: 'topic-' + title,
          type: 'topic',
          topic: title,
          url: href,
          avatar: avatar,
          name: description,
          description: description,
        };
      })()) || (catched(function () {
        const link = img.closest('[href]');
        const href = link && link.getAttribute('href') || avatar;
        // 未知关注内容
        return {
          id: 'unknown-' + href,
          type: 'unknown',
          url: href,
          avatar: avatar,
          description: title,
          name: title,
        };
      })());
    });

    return { allPages, followInPage };
  };
  request.getFollowingPage = getFollowingPage;

}());
