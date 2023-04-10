; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const dom = util.dom;

  const feedParser = yawf.feed = {};
  const commentParser = yawf.comment = {}; // eslint-disable-line no-unused-vars

  // 将时间格式化为东八区的 ISO 8601 串
  const date = function (dateStr) {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 8);
    if ((date.getUTCFullYear() + '').length !== 4) return '';
    return [
      date.getUTCFullYear(),
      '-', (date.getUTCMonth() + 1 + '').padStart(2, 0),
      '-', (date.getUTCDate() + '').padStart(2, 0),
      'T', (date.getUTCHours() + '').padStart(2, 0),
      ':', (date.getUTCMinutes() + '').padStart(2, 0),
      ':', (date.getUTCSeconds() + '').padStart(2, 0),
      '.', (date.getUTCMilliseconds() + '').padStart(3, 0),
      '+0800',
    ].join('');
  };

  const contentText = html => dom.parseHtml(html).textContent;
  const catched = (f, v = null) => feed => { try { return f(feed); } catch (e) { return v; } };
  const mid = mid => mid > 0 ? mid : null;

  feedParser.mid = feed => mid(feed.mid);
  feedParser.omid = feed => mid(feed.retweeted_status?.mid);

  feedParser.isFast = feed => feed.screen_name_suffix_new != null;
  feedParser.isFastForward = feed => feedParser.isFast(feed) && feed.ori_mid != null;
  feedParser.isForward = feed => feed.retweeted_status != null;

  const author = feedParser.author = {};
  author.avatar = catched(feed => feed.user.avatar_large || feed.user.avatar_hd, null);
  author.id = feed => [feed.user.idstr];
  author.name = feed => [feed.user.screen_name];
  const fauthor = feedParser.fauthor = {};
  fauthor.id = feed => feedParser.isFastForward(feed) ? [String(feed.ori_uid)] : []; // ori_mid 是被快转微博 id，ori_uid 是转快转的人的 id
  fauthor.name = catched(feed => feedParser.isFastForward(feed) ? [feed.screen_name_suffix_new.find(x => x.type === 2).content] : [], []);
  const original = feedParser.original = {};
  original.id = catched(feed => feed.retweeted_status ? [feed.retweeted_status.user.idstr] : [], []);
  original.name = catched(feed => feed.retweeted_status ? [feed.retweeted_status.user.screen_name] : [], []);
  const linkTopics = feed => {
    if (!Array.isArray(feed.url_struct)) return [];
    const topics = [];
    feed.url_struct.forEach(url => {
      const match = url.short_url.match(/#([^#]*)\[超话\]#/);
      if (match && match[0]) topics.push(match[0]);
    });
    return topics;
  };
  const text = feedParser.text = {};
  text.detail = feed => {
    let text = [feed, feed.retweeted_status].filter(x => x?.user).map(x => [
      x.user.screen_name,
      x.longTextContent_raw || x.text_raw,
      contentText(x.source),
      date(x.created_at),
    ]).reduce((x, y) => x.concat(y)).join('\u2028');
    if (Array.isArray(feed.url_struct)) {
      text = feed.url_struct.reduce(url => {
        if (!url?.short_url || !/https?:\/\//.test(url.short_url)) return text;
        return text.split(url.short_url).join((url.long_url || url.short_url) + '\ufff9' + (url.url_title ?? '') + '\ufffb');
      }, text);
    }
    const topics = linkTopics(feed).map(t => `#${t}[超话]#`).join('');
    if (topics) text += '\n' + topics;
    return text;
  };
  text.simple = feed => {
    let text = [feed, feed.retweeted_status].filter(x => x)
      .map(x => x.longTextContent_raw || x.text_raw).join('\n');
    if (Array.isArray(feed.url_struct)) {
      text = feed.url_struct.reduce(url => {
        if (!url?.short_url || !/https?:\/\//.test(url.short_url)) return text;
        return text.split(url.short_url).join(url.url_title || url.long_URL || url.short_url);
      }, text);
    }
    const topics = linkTopics(feed).map(t => `#${t}[超话]#`).join('');
    if (topics) text += '\n' + topics;
    return text;
  };
  const mention = feedParser.mention = {};
  mention.name = feed => {
    const text = [feed, feed.retweeted_status].filter(x => x)
      .map(x => x.longTextContent_raw || x.text_raw).join('\n');
    const users = text.match(/@[\u4e00-\u9fa5|\uE7C7-\uE7F3|\w_\-·]+/g) || [];
    return users.map(u => u.slice(1));
  };
  const topic = feedParser.topic = {};
  topic.text = feed => {
    const topics = linkTopics(feed);
    if (Array.isArray(feed.topic_struct)) {
      topics.push(...feed.topic_struct.map(topic => topic.topic_title));
    }
    if (Array.isArray(feed.url_struct)) {
      // 所有不是 https? 开头的链接
      topics.push(...feed.url_struct.map(x => x.short_url).filter(x => x && /^([#$]).*\1$/.test(x)));
    }
    return [...new Set(topics.map(text => text.replace(/[#\ue627$]|\[超话\]$/g, '').trim()))];
  };
  const source = feedParser.source = {};
  source.text = feed => {
    const sources = [feed, feed.retweeted_status].filter(x => x).map(x => contentText(x.source));
    return sources;
  };
  const pics = feedParser.pics = {};
  pics.info = feed => {
    const pics = [];
    [feed, feed.retweeted_status].forEach(fd => {
      if (fd?.pic_infos) pics.push(...Object.keys(fd.pic_infos).map(k => fd.pic_infos[k]));
    });
    return pics;
  };

}());

