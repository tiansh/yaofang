; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const dom = util.dom;

  class OrderMismatchCount {
    constructor() {
      this.buffer = [];
      this.lds = [1];
      this.ldsm = 0;
    }
    appendItems(items) {
      const buffer = this.buffer;
      const lds = this.lds;
      buffer.push(...items);
      for (let i = lds.length, l = buffer.length; i < l; i++) {
        let m = 1, v = buffer[i];
        for (let j = i - 1; j >= 0; j--) {
          let n = lds[j] + 1;
          if (v >= buffer[j]) continue;
          if (n > m) m = n;
        }
        lds[i] = m;
        if (m > this.ldsm) this.ldsm = m;
      }
    }
    errors() {
      return this.lds.length - this.ldsm;
    }
  }

  class FeedsByGroupLoader {
    constructor(group, params) {
      this.group = group;

      this.search = new URLSearchParams(params);
      ['gid', 'whisper', 'min_id', 'end_id'].forEach(key => this.search.delete(key));
      if (group.id.startsWith('g')) {
        this.search.set('gid', group.id.slice(1));
      } else if (group.id === 'whisper') {
        this.search.set('whisper', 1);
      }

      this.nextPage = 1;
      /** @type {{ type: "feed", date: number, mid: string, dom: Element }[]} */
      this.pendingFeeds = [];
      this.bufferSize = 10;
      this.orderMismatch = new OrderMismatchCount();
      /** @type {{ mid: string }[][]} */
      this.feedsByPage = [];
    }
    async peek() {
      await this.loadMore();
      return this.pendingFeeds[0];
    }
    async next() {
      await this.loadMore();
      return this.pendingFeeds.shift();
    }
    async hasNext() {
      await this.loadMore();
      return this.pendingFeeds.length > 0;
    }
    async loadMore() {
      if (this.nextPage === null) return;
      try {
        while (this.pendingFeeds.length < this.bufferSize) {
          const newLoaded = await this.loadNextPage();
          const errors = this.orderMismatch.errors();
          this.bufferSize = Math.max(this.bufferSize, errors * 5);
          if (!newLoaded) { this.nextPage = null; break; }
        }
      } catch (e) {
        this.nextPage = null;
      }
    }
    async loadNextPage() {
      this.nextPage++;
      const search = new URLSearchParams(this.search);
      if (this.feedsByPage.length) {
        const lastPage = this.feedsByPage[this.feedsByPage.length - 1];
        search.set('min_id', lastPage[0].mid);
        search.set('end_id', lastPage[lastPage.length - 1].mid);
      }
      const url = 'https://weibo.com/aj/mblog/fsearch?' + search;
      util.debug('fetch %s', url);
      const result = await fetch(url, { credentials: 'include' }).then(r => r.json());
      const container = document.createElement('div');
      dom.content(container, result.data);
      const feedElements = Array.from(container.querySelectorAll('.WB_feed_type[mid]'));
      const feeds = feedElements.map(item => {
        const dateitem = item.querySelector('[node-type="feed_list_item_date"][date]'); if (!dateitem) return null;
        const date = Number(dateitem.getAttribute('date')); if (!date) return null;
        const mid = item.getAttribute('mid'); if (!mid) return null;
        return { type: 'feed', date, mid, dom: item.cloneNode(true) };
      }).filter(feed => feed);
      this.feedsByPage.push(feeds);
      this.pendingFeeds.push(...feeds);
      this.pendingFeeds.sort((a, b) => b.date - a.date);
      this.orderMismatch.appendItems(feeds.map(({ date }) => date));
      return feeds.length;
    }
  }

  const feedsByGroup = function (group, params) {
    const loader = new FeedsByGroupLoader(group, params);
    return {
      next: () => loader.next(),
      hasNext: () => loader.hasNext(),
      peek: () => loader.peek(),
    };
  };
  request.feedsByGroup = feedsByGroup;

  class FeedsByGroupsLoader {
    constructor(groups, params) {
      this.loaders = Array.from(groups).map(group => new FeedsByGroupLoader(group, params));
      this.known = new Set();
    }
    async getLast() {
      const loaders = this.loaders;
      if (loaders.length === 0) return null;
      /** @type {{ loader: FeedsByGroupLoader, feed: { type: "feed", date: number, mid: string, dom: Element }|{ type: "done", group: { id: string } } }[]} */
      const feeds = (await Promise.all(loaders.map(async loader => {
        while (true) {
          const feed = await loader.peek();
          if (!feed) return { loader, feed: { type: 'done', group: loader.group } };
          if (!this.known.has(feed.mid)) {
            return { loader, feed };
          }
          await loader.next();
        }
      })));
      const empty = feeds.find(v => v.feed.type === 'done');
      if (empty) return empty;
      const last = feeds.reduce((a, b) => a.feed.date > b.feed.date ? a : b);
      return last;
    }
    async peek() {
      const { feed } = await this.getLast();
      return feed;
    }
    async next() {
      const { loader, feed } = await this.getLast();
      if (feed.type === 'feed') {
        await loader.next();
        this.known.add(feed.mid);
        return feed;
      } else {
        this.loaders.splice(this.loaders.indexOf(loader), 1);
        return feed;
      }
    }
    async hasNext() {
      return this.loaders.length > 0;
    }
    isShown(feed) {
      return this.known.has(feed.mid);
    }
    addShown(feed) {
      return this.known.add(feed.mid);
    }
  }

  const feedsByGroups = function (groups, params) {
    const loader = new FeedsByGroupsLoader(groups, params);
    return {
      next: () => loader.next(),
      hasNext: () => loader.hasNext(),
      peek: () => loader.peek(),
      isShown: feed => loader.isShown(feed),
      addShown: feed => loader.addShown(feed),
    };
  };
  request.feedsByGroups = feedsByGroups;

  class FeedsByGroupsUnreadCount {
    constructor(groups, stkInfo) {
      this.groups = Array.from(groups)
        .filter(group => group.id.startsWith('g'))
        .map(group => group.id.slice(1));
      this.stkInfo = stkInfo;
      this.callbacks = new Set();
      this.working = false;
      this.paused = false;
    }
    watch(callback) {
      this.callbacks.add(callback);
      if (!this.working) this.schedule();
    }
    unwatch(callback) {
      this.callbacks.delete(callback);
    }
    async schedule() {
      if (this.callbacks.size === 0) this.working = false;
      this.working = true;
      if (!this.paused) {
        const status = await this.check();
        setTimeout(() => { this.schedule(); }, 30e3);
        if (this.paused) return;
        this.callbacks.forEach(callback => {
          try {
            callback(status);
          } catch (e) {
            util.debug('Error while check unread feeds: %o', e);
          }
        });
      } else {
        setTimeout(() => { this.schedule(); }, 30e3);
      }
    }
    async check() {
      const url = new URL('https://rm.api.weibo.com/2/remind/unread_hint.json');
      url.searchParams.set('source', this.stkInfo.source);
      url.searchParams.set('with_url', 1);
      url.searchParams.set('appkeys', '');
      url.searchParams.set('group_ids', this.groups.join(','));
      url.searchParams.set('callback', network.fakeCallback());
      util.debug('Check unread by groups: %o', url);
      const resp = await fetch(url, { credentials: 'include' }).then(resp => resp.text());
      const data = network.parseJson(resp).data;
      const groupStatus = Object.assign(...data.groups);
      const result = Object.assign(...this.groups.map(group => ({ ['status_' + group]: Number(groupStatus[group]) })));
      result.status = this.groups.reduce((p, group) => p + groupStatus[group], 0);
      if (result.status) {
        util.debug('Check unread by groups got unread: %o', result.status);
      }
      return result;
    }
    pause() { this.paused = true; }
    run() { this.paused = false; }
  }

  const unreadByGroups = function (groups, stkInfo) {
    const loader = new FeedsByGroupsUnreadCount(groups, stkInfo);
    return {
      watch(callback) { loader.watch(callback); },
      unwatch(callback) { loader.unwatch(callback); },
      pause() { loader.pause(); },
      run() { loader.run(); },
    };
  };
  request.unreadByGroups = unreadByGroups;

}());
