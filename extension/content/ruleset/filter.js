/**
 * 这个文件用于自动检查页面中出现的微博和评论，并触发过滤规则
 * 涉及函数包括
 *   yawf.observer.<type>.<action>
 * <type>: feed / comment 处理微博 / 评论
 * <action>:
 *   add(rule: feed => string, { priority: number }): 添加一个规则
 *   onBefore(callback: feed => Promise?)
 *   onAfter(callback: feed => Promise?, result)
 *   onFinally(callback: feed => Promise?, result)
 *   onDone()
 */
; (async function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const storage = yawf.storage;
  const config = yawf.config;
  const init = yawf.init;
  const observer = yawf.observer;

  const priority = util.priority;
  const css = util.css;
  const i18n = util.i18n;

  const filter = yawf.filter = {};


  /**
   * 用于收集针对微博或评论的过滤规则，并根据优先级逐一检查
   */
  class FilterCollection {
    constructor() {
      /** @type {Array<{ priority: number, filter: Function}>} */
      this.filters = [];
    }
    /**
     * @param {Function} filter
     * @param {number} priority
     */
    add(filter, priority) {
      this.filters.push({ filter, priority });
      this.filters.sort((x, y) => y.priority - x.priority);
    }
    async filter(...params) {
      for (const { filter } of this.filters) {
        try {
          let ret = filter(...params);
          if (ret && !ret.result && typeof ret.then === 'function') {
            ret = await Promise.resolve(ret);
          }
          if (typeof ret === 'string') ret = { result: ret };
          if (!ret || !ret.result) continue;
          const { result, reason = null } = ret;
          return { result: result + '', reason: reason + '', filter };
        } catch (e) {
          util.debug('Exception while parsing rule %o: %o\n%o', filter, e, e.stack);
        }
      }
      return { result: null };
    }
  }

  /**
   * 在发现一条新的需要过滤的微博或评论时，会依次调用：
   *   1. onBefore(feed)
   *   2. 逐个调用过滤规则
   *   3. 如果过滤规则表明未被隐藏 onAfter(feed, { result, reason })
   *   4. onFinally(feed, { result, reason })
   * 所有元素完成处理时调用 onDone
   * 所有回调如果返回 Promise，则会等待 Promise 结束再进入下一阶段
   */
  class FilterObserver {
    constructor() {
      this.before = [];
      this.after = [];
      this.finally = [];
      this.done = [];
      this.filters = new FilterCollection();
      this.pending = [];
      this.busy = false;
      this.clean = null;
    }
    add(filter, { priority }) {
      this.filters.add(filter, priority);
    }
    /** @param {Array<Function>} callbacks */
    async invokeCallbacks(callbacks, ...args) {
      await Promise.all(callbacks.map(callback => (
        new Promise(async resolve => {
          try {
            await Promise.resolve(callback(...args));
          } catch (e) {
            util.debug('Error while filter callback: %o %o', callback, e);
          }
          resolve();
        })
      )));
    }
    async active(items) {
      if (this.busy) {
        this.pending.push(...items);
        if (!this.clean) {
          this.clean = new Promise(resolve => {
            this.resolve = resolve;
          });
        }
        await this.clean;
        return;
      }
      this.busy = true;
      const promises = [];
      for (const item of items) {
        promises.push((async () => {
          await this.invokeCallbacks(this.before, item);
          const result = await this.filters.filter(item);
          const callAfter = this.apply(item, result);
          if (callAfter) {
            await this.invokeCallbacks(this.after, item, result);
          }
          await this.invokeCallbacks(this.finally, item, result);
          await new Promise(resolve => setTimeout(resolve, 0));
        })());
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      await Promise.all(promises);
      await this.invokeCallbacks(this.done);
      this.busy = false;
      if (this.pending.length) {
        await this.active(this.pending.splice(0));
        return;
      }
      if (this.clean) this.clean = null;
      if (this.resolve) {
        this.resolve();
        this.resolve = null;
      }
    }
    onBefore(callback) { this.before.push(callback); }
    onAfter(callback) { this.after.push(callback); }
    onFinally(callback) { this.finally.push(callback); }
    onDone(callback) { this.done.push(callback); }
  }

  const removeHiddenItem = function (item, { result }) {
    if (result !== 'hide') return;
    item.parentNode.removeChild(item);
  };

  const foldFeedUnfold = function (feed, { result }) {
    if (result !== 'fold') return;
    const unfold = function () {
      feed.setAttribute('yawf-feed-display', 'unfold');
      feed.removeEventListener('click', unfold);
    };
    feed.addEventListener('click', unfold);
  };

  /**
   * 针对微博的过滤规则
   * 对应脚本版 observer.weibo.*
   */
  filter.feed = new FilterObserver();
  filter.feed.apply = function (feed, { result, filter = null, reason = null }) {
    feed.setAttribute('yawf-feed-display', result || 'unset');
    if (result && result !== 'unset') {
      const author = feed.querySelector('.WB_detail > .WB_info > .W_fb[usercard]').title;
      feed.setAttribute('yawf-feed-author', author);
      feed.setAttribute('yawf-feed-reason', reason);
      util.debug('Feed filter %o -> %o by %o due to %o', feed, result, filter, reason);
    }
    if (result === 'hide') return false;
    return true;
  };
  filter.feed.onFinally(removeHiddenItem);
  filter.feed.onFinally(foldFeedUnfold);

  /**
   * 针对评论的过滤规则
   * 对应脚本版 observer.comment
   */
  filter.comment = new FilterObserver();
  filter.comment.apply = function (comment, { result, filter = null, reason = null }) {
    comment.setAttribute('yawf-comment-display', result || 'unset');
    if (result && result !== 'unset') {
      util.debug('Comment filter %o -> %o by %o due to %o', comment, result, filter, reason);
    }
    if (result === 'hide') return false;
    return true;
  };
  filter.comment.onFinally(removeHiddenItem);


  init.onLoad(function () {
    // 自动检测页面中的微博并触发过滤规则
    observer.add(function feedFilter() {
      const feeds = document.querySelectorAll([
        '[action-type="feed_list_item"]:not([yawf-feed])',
        '[node-type="feed_list"] .WB_feed_type:not([yawf-feed])',
      ].join(','));
      if (!feeds.length) return;
      feeds.forEach(feed => feed.setAttribute('yawf-feed', ''));
      filter.feed.active(feeds);
    });
    // 自动检测页面中的评论并触发过滤规则
    observer.add(function commentFilter() {
      const comments = document.querySelectorAll([
        '.list_ul[node-type="feed_list_commentList"] .list_li:not([yawf-comment])',
        '.list_ul[node-type="comment_list"] .list_li:not([yawf-comment]) ',
      ].join(','));
      if (!comments.length) return;
      comments.forEach(comment => comment.setAttribute('yawf-comment', ''));
      filter.comment.active(comments);
    });
  }, { priority: priority.LAST });

  i18n.foldReason = {
    cn: '"已折叠 @" attr(yawf-feed-author) " 的一条微博"',
    tw: '"已折疊 @" attr(yawf-feed-author) " 的一條微博"',
    en: '"A feed posted by @" attr(yawf-feed-author)',
  };

  css.append(`
[action-type="feed_list_item"]:not([yawf-feed])', '[node-type="feed_list"] .WB_feed_type:not([yawf-feed]) { display: none; }
[yawf-feed]:not([yawf-feed-display]) { visibility: hidden; opacity: 0; }
[yawf-feed-display="hide"] { display: none; }
[yawf-feed-display="fold"] { position: relative; }
[yawf-feed-display="fold"] > * { display: none; }
[yawf-feed-display="fold"]::before { text-align: center; padding: 10px 20px; display: block; opacity: 0.6; }
.WB_feed_type[yawf-feed-display="fold"] .WB_feed_detail { display: block; max-height: 0; transition: max-height, padding 0.1s; overflow: hidden; padding: 0 20px; }
.WB_feed_type[yawf-feed-display="fold"]:hover .WB_feed_detail:not(:hover) { max-height: 1000px; padding: 0 20px 27px; }
`);
  init.onLoad(function () {
    css.append(`[yawf-feed-display="fold"]::before { content: ${i18n.foldReason}; }`);
  });

  // 单条微博页面永远不应当隐藏微博
  filter.feed.add(function singleWeiboPageUnsetRule() {
    return document.querySelector('[id^="Pl_Official_WeiboDetail__"]') ? 'unset' : null;
  }, { priority: 1e6 });
  // 头条文章是一条微博，类似于单条微博，不应当隐藏
  filter.feed.add(function singleWeiboPageUnsetRule(feed) {
    return util.dom.matches(feed, '.WB_artical *') ? 'unset' : null;
  }, { priority: 1e6 });
  // 无论因为何种原因，同一页面上同一条微博不应出现两次
  filter.feed.add(function hideDuplicate(feed) {
    if (feed.hasAttribute('yawf-not-duplicate')) return null;
    const mid = feed.getAttribute('mid'); if (!mid) return null;
    const all = document.querySelectorAll('.WB_feed_type:not([yawf-not-duplicate])');
    if (all.find(that => that.getAttribute('mid') === mid)) return 'hide';
    return null;
  }, { priority: 1e6 });

}());
