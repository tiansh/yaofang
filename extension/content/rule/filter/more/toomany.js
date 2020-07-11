; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;
  const init = yawf.init;

  const more = yawf.rules.more;

  const i18n = util.i18n;
  i18n.otherFloodingTitle = {
    cn: '刷屏',
    tw: '洗版',
    en: 'Flooding',
  };

  const flooding = more.flooding = {};
  flooding.flooding = rule.Group({
    parent: more.more,
    template: () => i18n.otherFloodingTitle,
  });

  Object.assign(i18n, {
    floodingFeedHide: { cn: '隐藏', tw: '隱藏', en: 'hidden' },
    floodingFeedFold: { cn: '折叠', tw: '折疊', en: 'folded' },
    floodingAuthor: {
      cn: '相同作者|超过{{number}}条微博|时超出的{{action}}||{{group}}在分组页面同样生效',
      tw: '相同作者|超過{{number}}條微博|時超出的{{action}}||{{group}}在分組頁面同樣生效',
      en: 'Feeds by same author will | be {{action}} | when more than {{number}} seen||{{group}} Also apply to grouping pages',
    },
    floodingAuthorReason: {
      cn: '刷屏',
      tw: '洗版',
      en: 'flooding',
    },
    floodingForward: {
      cn: '相同微博的转发|超过{{number}}条|时超出的{{action}}',
      tw: '相同微博的轉發|超過{{number}}條|時超出的{{action}}',
      en: 'Feeds forwarded form same one will | be {{action}} | when more than {{number}} seen',
    },
    floodingForwardReason: {
      cn: '频繁转发',
      tw: '頻繁轉發',
      en: 'forwarded frequently',
    },
  });

  flooding.floodingAuthor = rule.Rule({
    id: 'flooding_author',
    version: 1,
    parent: flooding.flooding,
    template: () => i18n.floodingAuthor,
    ref: {
      number: {
        type: 'range',
        min: 1,
        max: 20,
        initial: 5,
      },
      action: {
        type: 'select',
        initial: 'hide',
        select: [
          { value: 'hide', text: () => i18n.floodingFeedHide },
          { value: 'fold', text: () => i18n.floodingFeedFold },
        ],
      },
      group: { type: 'boolean' },
    },
    init() {
      const rule = this;
      /** @type {WeakMap<Element, string>} */
      const parsed = new WeakMap();
      observer.feed.filter(function floodingAuthor(feed) {
        if (!rule.isEnabled()) return null;
        // 如果是因为修改规则导致的重新计算，那么我们不再做一次处理
        if (parsed.has(feed)) return null;
        const me = init.page.$CONFIG.uid;
        const [author] = feedParser.author.id(feed);
        const [fauthor] = feedParser.fauthor.id(feed);
        const authorId = fauthor || author;
        // 自己的微博发多少也不触发这个规则
        if (me === authorId) return null;
        // 个人主页不工作
        if (init.page.type() === 'profile') return null;
        // 分组页面根据设置决定是否生效
        if (init.page.type() === 'group') {
          if (rule.ref.group.getConfig()) return null;
        }
        parsed.set(feed, authorId);
        const feeds = [...document.querySelectorAll('.WB_feed_type')];
        const count = feeds.filter(feed => parsed.get(feed) === authorId).length;
        if (count <= rule.ref.number.getConfig()) return null;
        const result = rule.ref.action.getConfig();
        const reason = i18n.floodingAuthorReason;
        return { result, reason };
      }, { priority: -1e6 });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

  flooding.floodingForward = rule.Rule({
    id: 'flooding_forward',
    version: 1,
    parent: flooding.flooding,
    template: () => i18n.floodingForward,
    ref: {
      number: {
        type: 'range',
        min: 1,
        max: 20,
        initial: 3,
      },
      action: {
        type: 'select',
        initial: 'hide',
        select: [
          { value: 'hide', text: () => i18n.floodingFeedHide },
          { value: 'fold', text: () => i18n.floodingFeedFold },
        ],
      },
    },
    init() {
      const rule = this;
      /** @type {WeakMap<Element, string>} */
      const parsed = new WeakMap();
      observer.feed.filter(function floodingAuthor(feed) {
        if (!rule.isEnabled()) return null;
        if (parsed.has(feed)) return null;
        const omid = feedParser.omid(feed) || null;
        parsed.set(feed, omid);
        if (!omid) return null;
        const feeds = [...document.querySelectorAll('[mid]')];
        const count = feeds.filter(feed => parsed.get(feed) === omid).length;
        if (count <= rule.ref.number.getConfig()) return null;
        const result = rule.ref.action.getConfig();
        const reason = i18n.floodingForwardReason;
        return { result, reason };
      }, { priority: -1e6 });
      this.addConfigListener(() => { observer.feed.rerun(); });
    },
  });

}());
