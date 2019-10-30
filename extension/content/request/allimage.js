; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const getAllImages = async function (author, mid) {
    const url = new URL(`https://weibo.com/${author}/${util.mid.encode(mid)}`);
    const html = await network.fetchText(url + '');
    const domParser = new DOMParser();
    const page = domParser.parseFromString(html, 'text/html');
    const scripts = Array.from(page.querySelectorAll('script'));
    const feedModel = scripts.reduce((feedModel, script) => {
      if (feedModel) return feedModel;
      const content = script.textContent.match(/^\s*FM\.view\((\{.*\})\);?\s*$/);
      if (!content) return null;
      const model = JSON.parse(content[1]);
      if (model.ns !== 'pl.content.weiboDetail.index') return null;
      return model;
    }, null);
    if (!feedModel) return null;
    const feed = domParser.parseFromString(feedModel.html, 'text/html').querySelector('[mid]');
    const imgs = Array.from(feed.querySelectorAll('.WB_pic img'));
    return imgs.map(img => img.src.replace(/^https:/, ''));
  };
  request.getAllImages = getAllImages;

}());
