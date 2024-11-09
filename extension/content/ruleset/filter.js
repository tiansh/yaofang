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
      this.busy = null;
      this.resolve = null;
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
    async active(items) {
      this.pending.push(...items);
      if (this.busy) {
        await this.busy;
        return;
      }
      let resolve = null;
      this.busy = new Promise(r => { resolve = r; });
      while (this.pending.length) {
        while (this.pending.length) {
          const item = this.pending.shift();
          await this.invokeCallbacks(this.before, item);
          const result = await this.filters.filter(item);
          const callAfter = this.apply(item, result);
          if (callAfter) {
            await this.invokeCallbacks(this.after, item, result);
          }
          await this.invokeCallbacks(this.finally, item, result);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        await this.invokeCallbacks(this.done);
      }
      this.busy = null;
      resolve();
    }
    async rerun() {
      const lastRerun = this.lastRerun = {};
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
   * 我懒得查找依赖关系了，其实这个已经没用了
   */
  observer.comment = new FilterObserver();

  const hideFeedCss = css.add(`
article[class*="Feed"]:not(.yawf-feed-filter) > *,
article[class*="Feed"].yawf-feed-filter-loading > *,
article[class*="Feed"].yawf-feed-filter-running > * { visibility: hidden; }
article[class*="Feed"]:not(.yawf-feed-filter)::before,
article[class*="Feed"].yawf-feed-filter-loading::before,
article[class*="Feed"].yawf-feed-filter-running::before { content: " "; display: block; position: absolute; left: 100px; right: 100px; top: 50%; height: 140px; max-height: calc(100% - 20px); transform: translateY(-50%); background-image: repeating-linear-gradient(to bottom, transparent 0 20px, var(--w-panel-background) 20px 60px), linear-gradient(to right, var(--w-main) 40%, transparent 50%, var(--w-main) 60%); animation: yawf-feed-filter-running 2s 1s linear infinite; background-size: 200% 100%; background-repeat: repeat; opacity: 0.1; } 
@keyframes yawf-feed-filter-running { 0% { background-position: 120%; } 100% { background-position: -20%; } }
.yawf-resize-sensor,
.yawf-resize-sensor-expand,
.yawf-resize-sensor-shrink { position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow: hidden; z-index: -1; visibility: hidden; }
.yawf-resize-sensor-expand .yawf-resize-sensor-child { width: 10000000px; height: 10000000px; }
.yawf-resize-sensor-shrink .yawf-resize-sensor-child { width: 200%; height: 200%; }
.yawf-resize-sensor-child { position: absolute; top: 0; left: 0; transition: 0s; }
`);

  init.onDeinit(() => {
    hideFeedCss.remove();
  });

  init.onLoad(function () {
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
      const mid = data.mid, runIndex = data._yawf_FilterRunIndex;
      const event = new CustomEvent(key, {
        detail: JSON.stringify({ action: 'result', mid, runIndex, result: { result: result ?? 'unset', reason } }),
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
        if (!feedDetail?.isLongText) return;
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
          if (data?.longTextContent) {
            feedDetail.longTextContent_raw = data.longTextContent;
            if (data.url_struct) feedDetail.url_struct = data.url_struct;
            if (data.topic_struct) feedDetail.topic_struct = data.topic_struct;
          }
        } catch (e) {
          console.error('Error while fetching long text', e);
        }
        feedDetail._yawf_LongTextContentLoading = false;
      };
      const longContentExpand = async function (vm, feed) {
        for (let retry = 0; retry < 3; retry++) {
          try {
            await longContentExpandForDetail(vm, feed);
            await longContentExpandForDetail(vm, feed.retweeted_status);
            return true;
          } catch (_ignore) {
            await new Promise(resolve => setTimeout(resolve, 1e3));
          }
        }
        return false;
      };
      // 触发过滤并等待过滤结果回来
      const pendingFeeds = new Map();
      const triggerFilter = function (vm, feed) {
        const runIndex = feed._yawf_FilterRunIndex;
        feed._yawf_FilterStatus = 'running';
        return new Promise(resolve => {
          const cleanUp = function () {
            pendingFeeds.delete(runIndex);
            resolve({});
            vm.$off('hook:beforeDestroy', cleanUp);
          };
          vm.$once('hook:beforeDestroy', cleanUp);
          const handleFilterResult = function ({ result, reason }) {
            pendingFeeds.delete(runIndex);
            vm.$off('hook:beforeDestroy', cleanUp);
            feed._yawf_FilterStatus = result;
            feed._yawf_FilterReason = reason;
            resolve({ result, reason });
          };
          pendingFeeds.set(runIndex, handleFilterResult);
          const event = new CustomEvent(key, {
            detail: JSON.stringify({ action: 'trigger', runIndex, data: feed }),
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
      vueSetup.eachComponentVM('feed', function (vm) {
        const feedScroll = vueSetup.closest(vm, 'feed-scroll');

        // 在渲染一条 feed 时，额外插入过滤状态的标识
        vueSetup.transformComponentRender(vm, function (nodeStruct, Nodes) {
          const { vNode, addClass } = Nodes;

          // 如果某个 feed 不在 feed-scroll 里面
          // 那么我们不会把它就这么给隐藏起来
          const underFilter = feedScroll != null && this.data.mid > 0;

          const feed = nodeStruct;
          const vnode = vNode(feed);

          if (!vnode.key && this.data.mid) {
            vnode.key = 'yawf-feed-' + this.data.mid;
            if (this.data.ori_mid) {
              vnode.key = 'yawf-feed-' + this.data.mid + '-' + this.data.ori_mid;
            } else {
              vnode.key = 'yawf-feed-' + this.data.mid;
            }
          }

          addClass(feed, 'yawf-feed-filter');
          if (underFilter) {
            addClass(feed, `yawf-feed-filter-${this.data._yawf_FilterStatus || 'loading'}`);
          } else {
            addClass(feed, 'yawf-feed-filter-ignore');
          }

          if (this.data.mid) {
            vnode.data.attrs['data-feed-author-name'] = this.data.user.screen_name;
            vnode.data.attrs['data-feed-mid'] = this.data.mid;
            if (this.data.retweeted_status) {
              vnode.data.attrs['data-feed-omid'] = this.data.retweeted_status.mid;
            }
            if (this.data.ori_mid) {
              vnode.data.attrs['data-feed-fmid'] = this.data.idstr;
            }
            if (this.data._yawf_FilterReason) {
              vnode.data.attrs['data-yawf-filter-reason'] = this.data._yawf_FilterReason;
            }
          }
          return vnode;
        });
        vm.$forceUpdate();
      });
      let heightIndex = 0;
      vueSetup.eachComponentVM('scroll', function (vm) {
        const wrapRaf = function (f) {
          let dirty = false;
          return function () {
            if (dirty) return;
            dirty = true;
            requestAnimationFrame(function () {
              dirty = false;
              f();
            });
          };
        };
        // vm.__proto__.sizeDependencies 里面存的是原本关心的属性
        // 那个没什么统一的好办法给改过来，但是我们可以在 vm 自己身上设置这个属性来覆盖它
        // 因为设置的这个属性我们并不期望以后还有变化，所以我们不需要让它过 Vue 的生命周期 $forceUpdate 就是了
        Object.defineProperty(vm, 'sizeDependencies', { value: ['_yawf_Height'], configurable: true, enumerable: true, writable: true });
        const sensorPrefix = 'yawf_resize_sensor_element_';
        const getItemFromSensor = sensor => {
          if (!sensor?.id) return null;
          const index = Number.parseInt(sensor.id.slice(sensorPrefix.length), 10);
          // 在有微博被隐藏后，微博相对的索引会发生变化
          // 无法依赖微博的索引确定对应的微博
          // 所以我们不用 vm.data[index] 而只能这样找一遍
          const item = vm?.data?.find?.(item => item._yawf_HeightIndex === index);
          return item;
        };
        const observer = new ResizeObserver(entries => {
          entries.forEach(entry => {
            const { target } = entry;
            const item = getItemFromSensor(target);
            if (item) item._yawf_Height = target.clientHeight;
          });
        });
        // 如果可以把 sensor 做成组件的话，其实只要 mount 时处理一下就行了，不过这里是没办法
        const updateSensor = wrapRaf(function () {
          const allSensor = Object.keys(vm.$refs).filter(key => key.startsWith(sensorPrefix));
          allSensor.map(key => Number.parseInt(key.slice(sensorPrefix.length), 10)).forEach(index => {
            const container = vm.$refs[sensorPrefix + index];
            if (!container) return;
            observer.observe(container);
            const item = getItemFromSensor(container);
            if (item) item._yawf_Height = container.clientHeight;
          });
        });
        vm.$scopedSlots.content = (function (content) {
          return function (data) {
            const createElement = vm._self._c, h = createElement;
            const raw = content.call(this, data);
            // 给每个元素一个唯一的标识用于对应高度检测器
            // 我们没办法用现成的 mid 或 comment_id，因为我们并不知道元素是什么类型
            // 元素有可能是 feed，但也有可能是其他任何东西
            if (!data.item._yawf_HeightIndex) {
              data.item._yawf_HeightIndex = ++heightIndex;
            }
            const index = data.item._yawf_HeightIndex;
            const resizeSensor = h('div', {
              class: 'yawf-resize-sensor',
              ref: sensorPrefix + index,
              key: sensorPrefix + index,
              attrs: { id: sensorPrefix + index },
            });
            const result = Array.isArray(raw) ? raw : [raw];
            result.push(resizeSensor);
            updateSensor();
            return result;
          };
        }(vm.$scopedSlots.content));
        vm.$watch(function () { return this.data; }, function () {
          if (!Array.isArray(vm.data)) return;
          vm.data.forEach(item => {
            const descriptor = Object.getOwnPropertyDescriptor(item, '_yawf_Height');
            if (!descriptor) {
              vm.$set(item, '_yawf_Height', 0);
            } else if (!descriptor.set) {
              const size = vm._yawf_Height;
              delete vm._yawf_Height;
              vm.$set(item, '_yawf_Height', size);
            }
          });
        });
        vm.$forceUpdate();
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
          const runIndex = detail.runIndex;
          const handler = pendingFeeds.get(runIndex);
          if (handler) handler(detail.result);
        }
      }, true);
      let runIndex = 0;
      const seenFeeds = new WeakMap();
      const onBeforeUpdate = function () {
        const vm = this;
        if (!Array.isArray(vm.data)) return;
        vm.data.forEach(async feed => {
          if (seenFeeds.has(feed)) return;
          if (!(feed.mid > 0)) return;
          try {
            const id = runIndex++;
            vm.$set(feed, '_yawf_FilterStatus', 'loading');
            vm.$set(feed, '_yawf_FilterReason', null);
            vm.$set(feed, '_yawf_FilterApply', true);
            vm.$set(feed, '_yawf_FilterRunIndex', id);
            seenFeeds.set(feed, id);
            await longContentExpand(vm, feed);
            const { result, reason } = await triggerFilter(vm, feed);
            if (Array.isArray(vm.data) && vm.data.includes(feed)) {
              applyFilterResult(vm, feed, { result, reason });
            }
          } catch (e) {
            util.debug('Error while filter feed %o', feed);
            applyFilterResult(vm, feed, {});
          }
        });
      };
      vueSetup.eachComponentVM('feed-scroll', function (vm) {
        vm.$options.beforeUpdate.push(onBeforeUpdate);
        onBeforeUpdate();
      });
    }, util.inject.rootKey, key);
  }, { priority: priority.LAST });

}());

; (function () {
  const yawf = window.yawf;

  const util = yawf.util;
  const init = yawf.init;
  const observer = yawf.observer;

  const priority = util.priority;
  const css = util.css;
  const strings = util.strings;

  init.onLoad(function () {
    const configs = {
      text: {
        show: yawf.rules.comment.text.show.ref.items.getConfig(),
        hide: yawf.rules.comment.text.hide.ref.items.getConfig(),
      },
      regex: {
        show: yawf.rules.comment.regex.show.ref.items.getConfigCompiled(),
        hide: yawf.rules.comment.regex.hide.ref.items.getConfigCompiled(),
      },
      user: {
        show: yawf.rules.comment.name.show.ref.items.getConfig(),
        hide: yawf.rules.comment.name.hide.ref.items.getConfig(),
      },
      more: {
        bot: yawf.rules.comment.more.commentByBot.getConfig(),
      }
    };
    util.inject(function (rootKey, configs) {
      console.log(configs);
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;
      const matchText = (comment, textList) => (
        textList.some(text => comment.text_raw.includes(text))
      );
      const matchRegex = (comment, regexList) => (
        regexList.some(regex => regex.test(comment.text_raw))
      );
      const matchUser = (comment, nameList) => (
        nameList.some(name => (comment.screen_name === name ||
          comment.text.includes(`<a href=/n/${name} `)))
      );
      const matchBot = comment => (
        comment.analysis_extra?.includes('ai_type')
      );
      const filterComment = function (comment) {
        try {
          const isShow = (
            matchText(comment, configs.text.show) ||
            matchRegex(comment, configs.regex.show) ||
            matchUser(comment, configs.user.show) ||
          false);
          if (isShow) return 'show';
          const isHide = (
            matchText(comment, configs.text.hide) ||
            matchRegex(comment, configs.regex.hide) ||
            matchUser(comment, configs.user.hide) ||
            configs.more.bot && matchBot(comment) ||
          false);
          if (isHide) {
            console.log('Comment %o hidden', comment.idstr);
            return 'hide';
          }
          return null;
        } catch (error) {
          console.error('Error while filte comment: %o', error);
          return null;
        }
      };
      const handleCommentSubList = function (sublist) {
        for (let index2 = 0; index2 < sublist.length;) {
          const result2 = filterComment(sublist[index2]);
          if (result2 === 'hide') {
            sublist.splice(index2, 1);
            continue;
          }
          index2++;
        }
      };
      const handleCommentList = function (list) {
        for (let index1 = 0; index1 < list.length;) {
          const result = filterComment(list[index1]);
          if (result === 'hide') {
            list.splice(index1, 1);
            continue;
          }
          const sublist = list[index1].comments;
          if (sublist) {
            handleCommentSubList(sublist);
          }
          index1++;
        }
      };
      vueSetup.eachComponentVM('repost-coment-list', vm => {
        vm.$watch('list', handleCommentList, { immediate: true, deep: true })
      });
      vueSetup.eachComponentVM('feed', vm => {
        if (!vm.data.rcList) return;
        vm.$watch('data.rcList', rcList => {
          handleCommentList(rcList);
        }, { immediate: true, deep: true });
      });
      vueSetup.eachComponentVM('reply-modal', vm => {
        if (!vm.rootComment) return;
        vm.$watch('rootComment', rootComment => {
          handleCommentList([rootComment]);
        }, { immediate: true, deep: true });
        vm.$watch('list', list => {
          handleCommentSubList(list);
        }, { immediate: true, deep: true });
      });
    }, util.inject.rootKey, configs);
  }, { priority: priority.LAST });
}())

