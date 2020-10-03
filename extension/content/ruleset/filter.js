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
; (function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;
  const observer = yawf.observer;

  const priority = util.priority;
  const css = util.css;
  const i18n = util.i18n;
  const strings = util.strings;

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
    add(filter, priority = 0) {
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
          util.debug('Exception while parsing rule %o:\nparams: %o\nexception: %o\n%o', filter, params, e, e.stack);
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
    filter(filter, { priority = 0 } = {}) {
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
    async active(items, isAppend = true) {
      if (isAppend) {
        this.pending.push(...items);
      } else {
        this.pending.unshift(...items);
      }
      if (this.busy) {
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
      while (this.pending.length) {
        const item = this.pending.shift();
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
        await new Promise(resolve => setTimeout(resolve, 0));
        if (!this.busy) break;
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
    async rerun() {
      const lastRerun = this.lastRerun = (this.lastRerun || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (this.lastRerun !== lastRerun) return;
      this.reapply();
    }
    onBefore(callback) { this.before.push(callback); }
    onAfter(callback) { this.after.push(callback); }
    onFinally(callback) { this.finally.push(callback); }
    onDone(callback) { this.done.push(callback); }
  }

  /**
   * 针对微博的过滤规则
   * 对应脚本版 observer.weibo.*
   */
  observer.feed = new FilterObserver();

  /**
   * 针对评论的过滤规则
   * 对应脚本版 observer.comment
   */
  observer.comment = new FilterObserver();


  init.onLoad(function () {
    if (yawf.WEIBO_VERSION === 6) {
      observer.feed.apply = function (feed, { result, filter = null, reason = null }) {
        feed.setAttribute('yawf-feed-display', result || 'unset');
        if (result && result !== 'unset') {
          const author = feed.querySelector('.WB_detail > .WB_info > .W_fb[usercard]') ||
            feed.querySelector('.card-feed .info .name');
          const authorName = author && author.textContent;
          if (authorName) feed.setAttribute('yawf-feed-author', authorName);
          if (reason) feed.setAttribute('yawf-feed-reason', reason);
          util.debug('Feed filter %o -> %o by %o due to %o', feed, result, filter, reason);
        }
        if (result === 'hide') return false;
        return true;
      };
      observer.feed.reapply = function () {
        const parsed = Array.from(document.querySelectorAll('[yawf-feed-display]'));
        parsed.forEach(feed => {
          feed.removeEventListener('click', unfoldEventHandler);
        });
        return this.active(parsed, false);
      };
      observer.comment.apply = function (comment, { result, filter = null, reason = null }) {
        comment.setAttribute('yawf-comment-display', result || 'unset');
        if (result && result !== 'unset') {
          util.debug('Comment filter %o -> %o by %o due to %o', comment, result, filter, reason);
        }
        if (result === 'hide') return false;
        return true;
      };
      observer.comment.reapply = function () {
        const parsed = Array.from(document.querySelectorAll('[yawf-comment-display]'));
        return this.active(parsed, false);
      };
      const removeHiddenItem = function (item, { result }) {
        if (result !== 'hide') return;
        item.remove();
      };
      const unfoldEventHandler = function (event) {
        const feed = event.target.closest('[mid]');
        feed.setAttribute('yawf-feed-display', 'unfold');
        feed.removeEventListener('click', unfoldEventHandler);
      };
      const foldFeedUnfold = function (feed, { result }) {
        if (result !== 'fold') return;
        feed.addEventListener('click', unfoldEventHandler);
      };
      observer.feed.onFinally(removeHiddenItem);
      observer.feed.onFinally(foldFeedUnfold);
      observer.comment.onFinally(removeHiddenItem);

      // 自动检测页面中的微博并触发过滤规则
      observer.dom.add(function feedFilter() {
        const feeds = document.querySelectorAll([
          '[action-type="feed_list_item"]:not([yawf-feed])',
          '[node-type="feed_list"] .WB_feed_type:not([yawf-feed])',
        ].join(','));
        if (!feeds.length) return;
        feeds.forEach(feed => feed.setAttribute('yawf-feed', ''));
        observer.feed.active(feeds);
      });
      // 自动检测页面中的评论并触发过滤规则
      observer.dom.add(function commentFilter() {
        const comments = document.querySelectorAll([
          '.list_ul[node-type="feed_list_commentList"] .list_li:not([yawf-comment])',
          '.list_ul[node-type="comment_list"] .list_li:not([yawf-comment]) ',
        ].join(','));
        if (!comments.length) return;
        comments.forEach(comment => comment.setAttribute('yawf-comment', ''));
        observer.comment.active(comments);
      });
    } else {
      /*
       * 微博表示 Feed 的结构体很奇妙
       * 它的 idstr 属性，是个 string，是当前微博的 mid，也可能是快转的原微博 id
       * 它的 id 属性，大部分情况下是个 number，表示当前微博的 mid，偶尔是个字符串，表示快转微博的当前 id
       * 它的 mid 属性，是个 string，是 id 属性的字符串形式
       * 它的 mblogid 是 62 进制换算后的 idstr
       */

      const randStr = strings.randKey();
      const key = `yawf_feedFilter_${randStr}`;

      // 当有一条完成过滤规则判断时，交给页面脚本处理
      observer.feed.apply = function (data, { result, filter = null, reason = null }) {
        const mid = data.mid;
        const event = new CustomEvent(key, {
          detail: JSON.stringify({ action: 'result', mid, result: { result: result || 'unset', reason } }),
        });
        document.documentElement.dispatchEvent(event);
        if (result) util.debug('Feed filter %o -> %o by %o due to %o', data, result, filter, reason);
        if (result === 'hide') return false;
        return true;
      };
      // 如果需要重新触发过滤规则，那么让页面脚本重新触发一次
      observer.feed.reapply = function () {
        const event = new CustomEvent(key, { detail: JSON.stringify({ action: 'rerun' }) });
        document.documentElement.dispatchEvent(event);
      };
      // 当页面脚本检测到一条需要过滤的微博时，提交过滤
      window.addEventListener(key, function (event) {
        const detail = JSON.parse(event.detail);
        if (detail.action === 'trigger') {
          observer.feed.active([detail.data]);
        }
      }, true);
      util.inject(function (rootKey, key) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        // 展开微博正文
        const longContentExpandForDetail = async function (vm, feedDetail) {
          if (!feedDetail || !feedDetail.isLongText) return;
          if (feedDetail.longTextContent_raw) return;
          if ([true, false].includes(feedDetail._yawf_LongTextContentLoading)) return;
          vm.$set(feedDetail, '_yawf_LongTextContentLoading', true);
          vm.$set(feedDetail, 'longTextContent_raw', null);
          vm.$set(feedDetail, 'longTextContent', null);
          try {
            const resp = await vm.$http.get('/ajax/statuses/longtext', {
              params: { id: feedDetail.idstr },
            });
            if (!resp.data || !resp.data.ok || !resp.data.data) return;
            const data = resp.data.data;
            if (data && data.longTextContent) {
              feedDetail.longTextContent_raw = data.longTextContent;
              if (data.url_struct) feedDetail.url_struct = data.url_struct;
              if (data.topic_struct) feedDetail.topic_struct = data.topic_struct;
            }
          } catch (e) {
            console.error(e);
          }
          feedDetail._yawf_LongTextContentLoading = false;
        };
        const longContentExpand = async function (vm, feed) {
          await longContentExpandForDetail(vm, feed);
          await longContentExpandForDetail(vm, feed.retweeted_status);
        };
        // 触发过滤并等待过滤结果回来
        const pendingFeeds = new Map();
        const triggerFilter = function (vm, feed) {
          const mid = feed.mid;
          feed._yawf_FilterStatus = 'running';
          const cleanUp = function () {
            pendingFeeds.delete(mid);
            vm.$off('hook:beforeDestroy', cleanUp);
          };
          vm.$once('hook:beforeDestroy', cleanUp);
          return new Promise(resolve => {
            const handleFilterResult = function ({ result, reason }) {
              cleanUp();
              feed._yawf_FilterStatus = result;
              feed._yawf_FilterReason = reason;
              resolve({ result, reason });
            };
            pendingFeeds.set(mid, handleFilterResult);
            const event = new CustomEvent(key, {
              detail: JSON.stringify({ action: 'trigger', mid, data: feed }),
            });
            document.documentElement.dispatchEvent(event);
          });
        };
        // 处理过滤结果
        const applyFilterResult = function (vm, feed, { result, reason }) {
          if (result === 'hide') {
            const index = vm.data.indexOf(feed);
            vm.data.splice(index, 1);
          }
        };
        const setupSizeSensor = function (vm, attr) {
          const element = vm.$refs.yawf_resize_sensor_element;
          const expand = vm.$refs.yawf_resize_sensor_expand;
          const shrink = vm.$refs.yawf_resize_sensor_shrink;

          let lastHeight = element.offsetHeight, newHeight = null;
          let dirty = false;
          vm.$set(vm[attr], '_yawf_Size', lastHeight);
          const reset = function () {
            expand.scrollTop = 1e6;
            shrink.scrollTop = 1e6;
          };
          reset();
          const onResized = function () {
            if (lastHeight === newHeight) return;
            lastHeight = newHeight;
            vm[attr]._yawf_Size = newHeight;
            reset();
          };
          const onScroll = function () {
            newHeight = element.offsetHeight;
            if (dirty) return;
            dirty = true;
            requestAnimationFrame(function () {
              dirty = false;
              onResized();
            });
          };
          expand.addEventListener('scroll', onScroll);
          shrink.addEventListener('scroll', onScroll);
        };
        const addResizeSensor = function (vdom, h) {
          // 在末尾插入一个用来侦测元素高度的元素
          const children = vdom.children || vdom.componentOptions.children;
          if (Array.isArray(children)) {
            const resizeSensor = h('div', { key: 'yawf-resize-sensor', class: 'yawf-resize-sensor', ref: 'yawf_resize_sensor_element' }, [
              h('div', { class: 'yawf-resize-sensor-expand', ref: 'yawf_resize_sensor_expand' }, [
                h('div', { class: 'yawf-resize-sensor-child' }),
              ]),
              h('div', { class: 'yawf-resize-sensor-shrink', ref: 'yawf_resize_sensor_shrink' }, [
                h('div', { class: 'yawf-resize-sensor-child' }),
              ]),
            ]);
            children.push(resizeSensor);
          }
        };
        vueSetup.eachComponentVM('feed', function (vm) {
          const feedScroll = vueSetup.closest(vm, 'feed-scroll');
          const scrollItem = vueSetup.closest(vm, 'scroll');

          // 在渲染一条 feed 时，额外插入过滤状态的标识
          vm.$options.render = (function (render) {
            return function (createElement) {
              // 如果某个 feed 不在 feed-scroll 里面
              // 那么我们不会把它就这么给隐藏起来
              const underFilter = feedScroll != null && this.mid > 0;
              const result = render.call(this, createElement);
              Object.assign(result.data.class, {
                'yawf-feed-filter': true,
                'yawf-feed-filter-ignore': !underFilter,
                [`yawf-feed-filter-${this.data._yawf_FilterStatus || 'loading'}`]: underFilter,
              });
              result.data.attrs['data-feed-author-name'] = this.data.user.screen_name;
              result.data.attrs['data-feed-mid'] = this.data.mid;
              if (this.data.retweeted_status) {
                result.data.attrs['data-feed-omid'] = this.data.retweeted_status.mid;
              }
              if (this.data.ori_mid) {
                result.data.attrs['data-feed-fmid'] = this.data.idstr;
              }
              if (this.data._yawf_FilterReason) {
                result.data.attrs['data-yawf-filter-reason'] = this.data._yawf_FilterReason;
              }
              if (scrollItem) {
                addResizeSensor(result, createElement);
              }
              return result;
            };
          }(vm.$options.render));
          vm.$forceUpdate();
          // 每次高度变化时更新 _yawf_Size 属性
          // 我也不知道这段代码怎么工作起来的，反正网上的代码就这逻辑，然后也真的能用
          if (scrollItem) {
            vm.$nextTick(function () {
              setupSizeSensor(vm, 'data');
            });
          }
        });
        ['comment', 'repost', 'reply'].forEach(componentName => {
          vueSetup.eachComponentVM(componentName, function (vm) {
            const scrollItem = vueSetup.closest(vm, 'scroll');
            vm.$options.render = (function (render) {
              return function (createElement) {
                const result = render.call(this, createElement);
                if (scrollItem) {
                  addResizeSensor(result, createElement);
                }
                return result;
              };
            }(vm.$options.render));
            vm.$forceUpdate();
            if (scrollItem) {
              vm.$nextTick(function () {
                setupSizeSensor(vm, 'item');
              });
            }
          });
        });
        vueSetup.eachComponentVM('scroll', function (vm) {
          if (['repost-comment-list', 'feed-scroll'].some(id => vueSetup.closest(vm, id))) {
            // vm.__proto__.sizeDependencies 里面存的是原本关心的属性
            // 那个没什么统一的好办法给改过来，但是我们可以在 vm 自己身上设置这个属性来覆盖它
            // 因为设置的这个属性我们并不期望以后还有变化，所以我们不需要让它过 Vue 的生命周期 $forceUpdate 就是了
            Object.defineProperty(vm, 'sizeDependencies', { value: ['_yawf_Size'], configurable: true, enumerable: true, writable: true });
            vm.$forceUpdate();
          }
        });
        window.addEventListener(key, function (event) {
          const detail = JSON.parse(event.detail);
          if (detail.action === 'rerun') {
            // 对现有的元素再来一次
            vueSetup.eachComponentVM('feed-scroll', function (vm) {
              [...vm.data].forEach(async feed => {
                if (['loading', 'running'].includes(feed._yawf_FilterStatus)) return;
                const { result, reason } = await triggerFilter(vm, feed);
                applyFilterResult(vm, feed, { result, reason });
              });
            }, { watch: false });
          } else if (detail.action === 'result') {
            // 应用过滤结果
            const handler = pendingFeeds.get(detail.mid);
            if (handler) handler(detail.result);
          }
        }, true);
        vueSetup.eachComponentVM('feed-scroll', function (vm) {
          // 当 feed-scroll 内 feed 列表变化时，我们把那些没见过的全都标记一下
          vm.$watch(function () { return this.data; }, function () {
            const feeds = [...vm.data];
            feeds.forEach(async feed => {
              if (!(feed.mid > 0)) return;
              if (feed._yawf_FilterApply) return;
              vm.$set(feed, '_yawf_FilterStatus', 'loading');
              vm.$set(feed, '_yawf_FilterReason', null);
              vm.$set(feed, '_yawf_FilterApply', true);
              await longContentExpand(vm, feed);
              const { result, reason } = await triggerFilter(vm, feed);
              applyFilterResult(vm, feed, { result, reason });
            });
          }, { immediate: true });
        });


      }, util.inject.rootKey, key);
    }
  }, { priority: priority.LAST });

  i18n.foldReason = {
    cn: '"已折叠 @" attr(yawf-feed-author) " 的一条微博"',
    tw: '"已折疊 @" attr(yawf-feed-author) " 的一條微博"',
    en: '"A feed posted by @" attr(yawf-feed-author)',
  };

  const hideFeedCss = css.add(`
.yawf-WBV6 [action-type="feed_list_item"]:not([yawf-feed]),
.yawf-WBV6 [node-type="feed_list"] .WB_feed_type:not([yawf-feed]),
.yawf-WBV6 .list_ul[node-type="feed_list_commentList"] .list_li:not([yawf-comment]),
.yawf-WBV6 .list_ul[node-type="comment_list"] .list_li:not([yawf-comment])
.yawf-WBV6 { visibility: hidden; opacity: 0; }
.yawf-WBV6 [action-type="feed_list_item"]:not([yawf-feed]) [node-type="feed_list"] .WB_feed_type:not([yawf-feed]) { display: none; }
.yawf-WBV6 [yawf-feed]:not([yawf-feed-display]), [yawf-comment]:not([yawf-comment-display]) { visibility: hidden; opacity: 0; }
.yawf-WBV6 [yawf-comment-display="hide"], [yawf-feed-display="hide"] { display: none; }
.yawf-WBV6 [yawf-feed-display="fold"] { position: relative; }
.yawf-WBV6 [yawf-feed-display="fold"] > * { display: none; }
.yawf-WBV6 [yawf-feed-display="fold"]::before { text-align: center; padding: 10px 20px; display: block; opacity: 0.6; line-height: 16px; }
.yawf-WBV6 .WB_feed_type[yawf-feed-display="fold"] .WB_feed_detail { display: none; }
.yawf-WBV6 .WB_feed_type[yawf-feed-display="fold"]:hover .WB_feed_detail:not(:hover) { display: block; overflow: hidden; padding: 0 20px 27px; }
.yawf-WBV6 .WB_feed.WB_feed_v3 .WB_feed_type[yawf-feed-display="fold"].WB_feed_vipcover:hover .WB_feed_detail { padding-top: 0; }
.yawf-WBV6 .WB_feed_type[yawf-feed-display="fold"] .WB_feed_handle { display: none; }

.yawf-WBV7 .yawf-feed-filter-loading,
.yawf-WBV7 .yawf-feed-filter-running { visibility: hidden; }
.yawf-WBV7 .yawf-resize-sensor,
.yawf-WBV7 .yawf-resize-sensor-expand,
.yawf-WBV7 .yawf-resize-sensor-shrink { position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow: hidden; z-index: -1; visibility: hidden; }
.yawf-WBV7 .yawf-resize-sensor-expand .yawf-resize-sensor-child { width: 1000000px; height: 1000000px; }
.yawf-WBV7 .yawf-resize-sensor-shrink .yawf-resize-sensor-child { width: 200%; height: 200%; }
.yawf-WBV7 .yawf-resize-sensor-child { position: absolute; top: 0; left: 0; transition: 0s; }
`);
  init.onLoad(function () {
    css.append(`.yawf-WBV6 [yawf-feed-display="fold"]::before { content: ${i18n.foldReason}; }`);
  });
  init.onDeinit(() => {
    hideFeedCss.remove();
  });

  // 单条微博页面永远不应当隐藏微博
  observer.feed.filter(function singleWeiboPageUnsetRule() {
    return document.querySelector('[id^="Pl_Official_WeiboDetail__"]') ? 'unset' : null;
  }, { priority: 1e6 });
  // 头条文章是一条微博，类似于单条微博，不应当隐藏
  observer.feed.filter(function singleWeiboPageUnsetRule(feed) {
    if (yawf.WEIBO_VERSION !== 6) return null;
    return feed.matches('.WB_artical *') ? 'unset' : null;
  }, { priority: 1e6 });
  // 无论因为何种原因，同一页面上同一条微博不应出现两次
  // 2020年7月后，上一行注释是错的，因为快转之后他们的 mid 是一样的，需要用 fmid 区分
  // 不过就算是快转的，展示几次也没有任何意义，所以这段逻辑保持不变
  observer.feed.filter(function hideDuplicate(feed) {
    if (yawf.WEIBO_VERSION !== 6) return null;
    const mid = feed.getAttribute('mid');
    if (!mid) return null;
    const all = Array.from(document.querySelectorAll('.WB_feed_type[mid]'));
    if (all.find(that => that !== feed && that.getAttribute('mid') === mid)) return 'hide';
    return null;
  }, { priority: 1e6 });

}());
