; (function () {

  const yawf = window.yawf;

  const feedParser = yawf.feed = {};
  const commentParser = yawf.comment = {};

  // 文本
  // 文本分为完整模式（用于正则匹配）和简易模式（用于关键词）
  // 完整模式下产生的文本更复杂，可用于更复杂的过滤规则
  // 简单模式下产生的文本更符合一般用户的理解，更适合普通用户使用
  /**
   * 找到一组 Node 的公共祖先
   * @param {Node[]} nodes
   */
  const commonParent = function (...nodes) {
    if (nodes.length === 0) return null;
    if (nodes.length === 1) return nodes[0];
    const firstParents = [];
    let parentIndex = 0;
    for (let [r] = nodes; r; r = r.parentElement) firstParents.push(r);
    for (let i = 0, l = nodes.length; i < l; i++) {
      for (let p = nodes[i]; true; p = p.parentElement) {
        if (!p) return null;
        const index = firstParents.indexOf(p, parentIndex);
        if (index === -1) continue;
        parentIndex = index;
        break;
      }
    }
    return firstParents[parentIndex];
  };

  /**
   * 检查一个节点是不是另一个节点的祖先节点
   * @param {Node|NodeList|Node[]} parent
   * @param {Node|NodeList|Node[]} child
   * @return {boolean}
   */
  const contains = function (parent, child) {
    if (!parent || !child) return false;
    if (!(child instanceof Node)) {
      const children = Array.from(child);
      return children.every(child => contains(parent, child));
    }
    if (parent instanceof Node) {
      return parent.contains(child);
    } else {
      const parents = new Set(Array.from(parent));
      for (let e = child; e; e = e.parentElement) {
        if (parents.has(e)) return true;
      }
    }
    return false;
  };

  /**
   * 检查某个元素是否是一条微博
   * @param {Element} element
   * @returns {boolean}
   */
  const isFeedElement = function (element) {
    if (!(element instanceof Element)) return false;
    if (!element.hasAttribute('mid')) return false;
    return true;
  };

  /**
   * 检查某个元素是否是一条搜索页面的微博
   * @param {Element} element
   * @returns {boolean}
   */
  const isSearchFeedElement = function (element) {
    if (!isFeedElement(element)) return false;
    if (!element.matches('.card-wrap')) return false;
    if (!element.querySelector('.card-feed')) return false;
    return true;
  };

  /**
   * 检查某个元素是否是一条评论
   * @param {Element} element
   * @returns {boolean}
   */
  const isCommentElement = function (element) {
    if (!(element instanceof Element)) return false;
    if (!element.hasAttribute('comment_id')) return false;
    return true;
  };


  /**
   * 检查某个元素是否是一条转发的微博
   * @param {Element} element
   * @returns {boolean}
   */
  const isForwardFeedElement = function (element) {
    if (!isFeedElement(element)) return false;
    if (!element.hasAttribute('omid')) return false;
    return true;
  };

  /**
   * 获取一条微博中所有内容相关的节点
   * @param {Element} feed
   * @returns {Element[]}
   */
  const feedContentElements = function (feed, { detail = false, short = false, long = true } = {}) {
    if (!isFeedElement(feed)) return null;
    const content = feedParser.content.dom(feed, true, false);
    const contentFull = feedParser.content.dom(feed, true, true);
    let post = contentFull ? !short ? [contentFull] : long ? [content, contentFull] : [content] : [content];
    if (detail) {
      const [author] = feedParser.author.dom(feed);
      const [source] = feedParser.source.dom(feed, true);
      const [date] = feedParser.date.dom(feed, true);
      post = [author, ...post, source, date];
    }
    if (feed.hasAttribute('omid')) {
      const reason = feedParser.content.dom(feed, false, false);
      const reasonFull = feedParser.content.dom(feed, false, true);
      let ori = reasonFull ? !short ? [reasonFull] : long ? [reason, reasonFull] : [reason] : [reason];
      if (detail) {
        const [original] = feedParser.original.dom(feed);
        const [sourceOri] = feedParser.source.dom(feed, false);
        const [dateOri] = feedParser.date.dom(feed, false);
        ori = [original, ...ori, sourceOri, dateOri];
      }
      return [...post, null, ...ori];
    }
    return post;
  };

  /**
   * 获取一条微博中所有内容相关的节点
   * @param {Element} comment
   * @returns {Element[]}
   */
  const commentContentElements = function (comment) {
    if (!isCommentElement(comment)) return null;
    const text = comment.querySelector('.WB_text');
    return [text];
  };

  /**
   * 获取节点所在的微博
   * @param {Node} node
   * @returns {Element}
   */
  const feedContainer = function (node) {
    if (!node) return null;
    if ((node instanceof Node) && !(node instanceof Element)) {
      return feedContainer(node.parentNode);
    }
    return node.closest('[mid]');
  };
  feedParser.feedNode = node => feedContainer(node);

  /**
   * 获取节点所在的评论
   * @param {Node} node
   * @returns {Element}
   */
  const commentContainer = function (node) {
    if (!node) return null;
    if ((node instanceof Node) && !(node instanceof Element)) {
      return commentContainer(node.parentNode);
    }
    return node.closest('[comment_id]');
  };
  feedParser.commentNode = node => feedContainer(node);

  const textParser = function (detail, containerType) {
    const parsers = [];
    /**
     * 普通文本（文本✓，正则✓）
     * @param {Node} node
     */
    const text = node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim().replace(/\s/g, ' ');
      }
      return null;
    };
    parsers.push(text);
    /**
     * 展开/收起全文（不计入内容）
     * @param {Element} node
     */
    const fold = node => {
      if (node.matches('a[action-type="fl_unfold"], a[action-type="fl_fold"]')) {
        return '';
      }
      return null;
    };
    parsers.push(fold);
    /**
     * 换行符 <br> （文本✓，正则✓）
     * @param {Element} node
     */
    const lineBreak = node => {
      if (node.matches('br, .yawf-line-break')) {
        return '\n';
      }
      return null;
    };
    parsers.push(lineBreak);
    /**
     * #话题#（文本✓，正则✓）
     * @param {Element} node
     */
    const topic = node => {
      let topic = null;
      if (node.matches('a[suda-uatrack*="1022-topic"]') && node.title) {
        topic = node.title.replace(/^[\s#]+|[\s#]+$/g, '');
        if (node.querySelector('.ficon_supertopic')) topic = '\ue627' + topic;
      }
      if (!topic && node.matches('a.a_topic, a[suda-uatrack*="1022-topic"]')) {
        topic = node.textContent.replace(/^[\s#]+|[\s#]+$/g, '');
      }
      if (!topic && node.matches('a[suda-uatrack*="1022-stock"]')) {
        topic = node.textContent.replace(/^[\s$]+|[\s$]+$/g, '');
      }
      if (topic) {
        const [_, superTopic, text] = topic.match(/^(?=(\ue627?|.*\[超话\]|.*超话$))[\ue627\s]*(.*?)(?:\[超话\]|超话)?$/);
        if (superTopic && detail) return ` #${text}[超话]# `;
        if (detail) return ` #${text}# `;
        return `#${text}#`;
      }
      return null;
    };
    parsers.push(topic);
    /**
     * $股票$（文本✓，正则✓）
     * @param {Element} node
     */
    const stock = node => {
      if (node.matches('a[suda-uatrack*="1022-stock"]')) {
        const text = node.textContent.trim().replace(/^\$?|\$?$/g, '');
        if (detail) return ` $${text}$ `;
        return `$${text}$`;
      }
      return null;
    };
    parsers.push(stock);
    /**
     * [表情]（文本✓，正则✓）
     * @param {Element} node
     */
    const emotion = node => {
      if (node.matches('img[type="face"][alt]')) {
        const text = node.getAttribute('alt').trim()
          .replace(/^\[?/, '[').replace(/\]?$/, ']');
        if (detail) return ` ${text} `;
        return text;
      }
      return null;
    };
    parsers.push(emotion);

    /**
     * 如果我们拿到一个作者或者原作者的链接，我们还可以拿到他的那些小图标
     * @param {Element} node
     */
    const userIcons = function (node) {
      const isSearch = isSearchFeedElement(feedContainer(node));
      const items = [];
      if (isSearch) {
        const sibling = [...node.parentNode.children];
        items.push(...sibling.filter(item => item.matches('a[title]')));
      } else {
        items.push(...node.parentNode.querySelectorAll('[title]'));
      }
      const icons = items.filter(item => item !== node && item.title.trim());
      return icons.map(icon => `[${icon.title.trim()}]`);
    };

    /**
     * @作者（文本✗，正则✓）
     * @param {Element} node
     */
    const author = node => {
      if (!node.matches('.WB_detail > .WB_info > .W_fb[usercard]')) return null;
      if (!detail) return '';
      const name = '@' + node.textContent.trim();
      const icons = userIcons(node);
      return [name, ...icons].join(' ');
    };
    parsers.push(author);
    /**
     * @原作（文本✗，正则✓）
     * @param {Element} node
     */
    const original = node => {
      if (!node.matches('.WB_expand > .WB_info > .W_fb[usercard]')) return null;
      if (!detail) return '';
      const name = node.textContent.trim().replace(/^@?/, '@');
      const icons = userIcons(node);
      return [name, ...icons].join(' ');
    };
    parsers.push(original);
    /**
     * @提到（文本✓，正则✓）
     * @param {Element} node
     */
    const mention = node => {
      if (node.matches('a[usercard]')) {
        return node.textContent.trim().replace(/^@?/, '@') + ' ';
      }
      return null;
    };
    parsers.push(mention);
    /**
     * 来源（文本✗，正则✓）
     * @param {Element} node
     */
    const source = node => {
      if (!node.matches('.WB_from a:not([date]):not([yawf-date])')) return null;
      if (!detail) return '';
      return (node.title || node.textContent).trim();
    };
    parsers.push(source);
    /**
     * 时间（文本✗，正则✓）
     * @param {Element} node
     */
    const timestamp = node => {
      if (!node.matches('a[date], a[yawf-date]')) return null;
      if (!detail) return '';
      const date = new Date(+(node.getAttribute('date') || node.getAttribute('yawf-date')));
      // 将时间格式化为东八区的 ISO 8601 串
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
    parsers.push(timestamp);
    /**
     * 链接
     * URL（文本✗，正则✓）
     * 标题（文本✓，正则✓）
     * @param {Element} node
     */
    const link = node => {
      const output = [];
      if (!node.matches('a[action-type="feed_list_url"]')) return null;
      if (node.matches('[suda-uatrack*="1022-topic"]')) return null;
      if (detail) {
        const url = new URL(node.href.trim());
        if (url.host + url.pathname === 'feed.mix.sina.com.cn/link_card/redirect') {
          output.push(url.searchParams.get('url'));
        } else output.push(url.href);
        output.push('\ufff9');
        const icon = node.querySelector('.W_ficon');
        if (icon) output.push(icon.textContent);
      }
      if (node.matches('[title]')) {
        output.push(node.getAttribute('title').trim());
      }
      if (detail) {
        output.push('\ufffb');
      }
      if (output.length) return ' ' + output.join(' ') + ' ';
      return null;
    };
    parsers.push(link);

    /**
     * @param {Node} node
     * @returns {string}
     */
    const allParser = function (node) {
      return parsers.reduce((result, parser) => {
        if (result != null) return result;
        return parser(node);
      }, null);
    };

    /**
     * @param {Node} node
     * @returns {string}
     */
    const parseNode = function parseNode(node, isSearch = null) {
      const text = allParser(node);
      if (text != null) return text;
      if (node.hasChildNodes()) {
        return [...node.childNodes].map(node => parseNode(node)).join('');
      }
      return '';
    };

    /**
     * @param {Selection} selection
     * @returns {string[]}
     */
    const parseSelection = function (selection) {
      const ranges = [...Array(selection.rangeCount)]
        .map((_, i) => selection.getRangeAt(i));
      const rangeElements = ranges.map(range => {
        return commonParent(range.startContainer, range.endContainer);
      });
      const container = containerType === 'feed' ? feedContainer : commentContainer;
      const contentElements = containerType === 'feed' ? feedContentElements : commentContentElements;
      const feed = container(commonParent(...rangeElements));
      if (!feed) return null;
      const elements = contentElements(feed, { detail, short: true, long: true });
      if (!elements) return null;
      if (rangeElements.some(re => !contains(elements, re))) return null;
      return ranges.map((range, rangeIndex) => {
        const [start, end] = [range.startContainer, range.endContainer];
        if (start === end) {
          if (start instanceof Text) {
            return start.textContent.slice(range.startOffset, range.endOffset);
          }
          return parseNode(start);
        }
        let status = 0;
        return (function parseNode(node) {
          if (node === start && node instanceof Text) {
            return node.textContent.slice(range.startOffset);
          }
          if (node === end && node instanceof Text) {
            return node.textContent.slice(0, range.endOffset);
          }
          const text = allParser(node);
          if (text) {
            if (node === start) status = 1;
            if (node === end) status = 2;
            return status === 1 || node === end ? text : '';
          }
          if (node.hasChildNodes()) {
            return [...node.childNodes].map(node => parseNode(node)).join('');
          }
          return '';
        }(rangeElements[rangeIndex]));
      });
    };

    /** @type {WeakMap<Node, string>} */
    const nodeCache = new WeakMap();

    /**
     *//**
    * @param {Node} target
    * @returns {string}
    *//**
    * @param {Selection} target
    * @returns {string[]}
    */
    const parser = function (target) {
      if (target instanceof Node) {
        if (nodeCache.has(target)) return nodeCache.get(target);
        const text = parseNode(target);
        nodeCache.set(target, text);
        return text;
      }
      if (target instanceof Selection) {
        return parseSelection(target);
      }
      return null;
    };

    return parser;
  };

  const fullTextParser = textParser(true, 'feed');
  const simpleTextParser = textParser(false, 'feed');
  const commentTextParser = textParser(false, 'comment');

  const nodeTextParser = (target, detail) => {
    const parser = detail ? fullTextParser : simpleTextParser;
    const elements = feedContentElements(target, { detail, long: true });
    if (elements) {
      const texts = elements.map(element => parser(element) || '');
      return texts.join(detail ? '\u2028' : '\n');
    } else {
      return parser(target);
    }
  };

  const text = feedParser.text = {};
  text.detail = element => nodeTextParser(element, true);
  text.simple = element => nodeTextParser(element, false);

  // 内容区域
  const content = feedParser.content = {};
  content.dom = (feed, isMain, isFull) => {
    const isSearch = isSearchFeedElement(feed);
    if (isFull === false) {
      if (isMain && !isSearch) {
        return feed.querySelector('[node-type="feed_list_content"]');
      } else if (!isMain && !isSearch) {
        return feed.querySelector('[node-type="feed_list_reason"]');
      } else if (isMain) {
        return feed.querySelector('.content > [node-type="feed_list_content"]');
      } else {
        return feed.querySelector('[node-type="feed_list_forwardContent"] > [node-type="feed_list_content"]');
      }
    } else if (isFull === true) {
      if (isMain && !isSearch) {
        return feed.querySelector('[node-type="feed_list_content_full"]');
      } else if (!isMain && !isSearch) {
        return feed.querySelector('[node-type="feed_list_reason_full"]');
      } else if (isMain) {
        return feed.querySelector('.content > [node-type="feed_list_content_full"]');
      } else {
        return feed.querySelector('[node-type="feed_list_forwardContent"] > [node-type="feed_list_content_full"]');
      }
    } else {
      return content.dom(feed, true) || content.dom(feed, false);
    }
  };

  // 作者（这条微博是谁发的）
  const author = feedParser.author = {};
  author.dom = feed => {
    if (!(feed instanceof Node)) return [];
    if (!isSearchFeedElement(feed)) {
      const author = feed.querySelector('.WB_detail > .WB_info > .W_fb[usercard]');
      return author ? [author] : [];
    } else {
      const author = feed.querySelector('.card-feed .info .name');
      return author ? [author] : [];
    }
  };
  author.id = feed => {
    const domList = author.dom(feed);
    if (!isSearchFeedElement(feed)) {
      return domList.map(dom => new URLSearchParams(dom.getAttribute('usercard')).get('id'));
    } else {
      return domList.map(dom => {
        const [_, uid] = dom.pathname.match(/^\/(?:u\/)?(\d+)/) || [];
        return String(Number.parseInt(uid, 10));
      }).filter(uid => +uid);
    }
  };
  author.name = feed => {
    const domList = author.dom(feed);
    return domList.map(dom => dom.textContent.trim());
  };
  author.avatar = feed => {
    const domList = author.dom(feed);
    if (domList.length !== 1) return null;
    if (!isSearchFeedElement(feed)) {
      const img = feed.querySelector('.WB_face img');
      return img.src;
    } else {
      const img = feed.querySelector('.card-feed .avator img');
      return img.src;
    }
  };

  // 原作者（一条被转发的微博最早来自谁）
  const original = feedParser.original = {};
  original.dom = feed => {
    if (!(feed instanceof Node)) return [];
    if (!isSearchFeedElement(feed)) {
      const original = feed.querySelector('.WB_expand > .WB_info > .W_fb[usercard]');
      return original ? [original] : [];
    } else {
      const original = feed.querySelector('.card-comment .name');
      return original ? [original] : [];
    }
  };
  original.id = feed => {
    const domList = original.dom(feed);
    if (!isSearchFeedElement(feed)) {
      return domList.map(dom => new URLSearchParams(dom.getAttribute('usercard')).get('id'));
    } else {
      return domList.map(dom => {
        const [_, uid] = dom.pathname.match(/^\/(?:u\/)?(\d+)/) || [];
        return String(Number.parseInt(uid, 10));
      }).filter(uid => +uid);
    }
  };
  original.name = feed => {
    const domList = original.dom(feed);
    return domList.map(dom => dom.textContent.trim());
  };

  // 提到（微博中提到的人，转发路径中的人同属于提到）
  const mention = feedParser.mention = {};
  mention.dom = (feed, { short = false, long = true } = {}) => {
    const contents = feedContentElements(feed, { short, long });
    if (!isSearchFeedElement(feed)) {
      const domList = contents.map(content => {
        if (!content) return [];
        return Array.from(content.querySelectorAll('a[href*="loc=at"][usercard*="name"]'));
      }).reduce((x, y) => x.concat(y));
      return domList;
    } else {
      const linkList = contents.map(content => (
        content ? Array.from(content.querySelectorAll('a')) : []
      )).reduce((x, y) => x.concat(y));
      const domList = linkList.filter(link => {
        if (!['weibo.com', 'www.weibo.com'].includes(link.hostname)) return false;
        if (!/\/n\//.test(link.pathname)) return false;
        if (!/^@/.test(link.textContent.trim())) return false;
        return true;
      });
      return domList;
    }
  };
  mention.name = (feed, { short = false, long = true } = {}) => {
    const domList = mention.dom(feed, { short, long });
    if (!isSearchFeedElement(feed)) {
      return domList.map(dom => new URLSearchParams(dom.getAttribute('usercard')).get('name'));
    } else {
      return domList.map(dom => decodeURIComponent(dom.pathname.split('/')[2]));
    }
  };

  // 话题（包括话题和超话）
  const topic = feedParser.topic = {};
  topic.dom = (feed, { short = false, long = true } = {}) => {
    const isSearch = isSearchFeedElement(feed);
    const contents = feedContentElements(feed, { short, long });
    const domList = [];
    contents.forEach(content => {
      if (!content) return;
      if (!isSearch) {
        const topics = content.querySelectorAll([
          'a[suda-uatrack*="1022-topic"]',
          'a.a_topic',
        ].join(','));
        domList.push(...topics);
      } else {
        const links = Array.from(content.querySelectorAll('a'));
        links.forEach(link => {
          let isTopic = false;
          if (link.hostname === 's.weibo.com') {
            isTopic = /^#.*#$/.test(link.textContent.trim());
          }
          if (link.hostname === 'huati.weibo.com') {
            isTopic = /^\s*\ue627/.test(link.textContent);
          }
          if (isTopic) domList.push(link);
        });
      }
    });
    return domList;
  };
  topic.text = (feed, { short = false, long = true } = {}) => {
    const domList = topic.dom(feed, { short, long });
    return domList.map(dom => {
      const text = dom.title || dom.textContent;
      return text.replace(/[#\ue627]|\[超话\]$/g, '').trim();
    });
  };

  // 链接（除超话外所有的链接，包括外站链接、视频、文章等）
  const link = feedParser.link = {};
  link.dom = (feed, { short = false, long = true } = {}) => {
    const isSearch = isSearchFeedElement(feed);
    const contents = feedContentElements(feed, { short, long });
    const domList = [].concat(...contents.map(content => {
      if (!content) return [];
      if (!isSearch) {
        return content.querySelectorAll('a[action-type="feed_list_url"]');
      } else {
        const links = Array.from(content.querySelectorAll('a'));
        return links.filter(link => (
          link.querySelector('.wbicon').textContent.trim() === 'O'
        ));
      }
    }));
    const topics = new Set(feedParser.topic.dom(feed, { short, long }));
    return domList.filter(link => link && !topics.has(link));
  };
  link.text = (feed, { short = false, long = true } = {}) => {
    const domList = link.dom(feed, { short, long });
    return domList.map(dom => {
      const text = dom.title || dom.textContent;
      return text;
    });
  };

  // 来源
  const source = feedParser.source = {};
  source.dom = (feed, isMain) => {
    const isSearch = isSearchFeedElement(feed);
    if (isMain === true) {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_detail > .WB_from a:not([date]):not([yawf-date])'));
      } else {
        return Array.from(feed.querySelectorAll('.content > .from a:last-child:not(:first-child)'));
      }
    } else if (isMain === false) {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_expand .WB_from a:not([date]):not([yawf-date])'));
      } else {
        return Array.from(feed.querySelectorAll('.card-comment .from a:last-child:not(:first-child)'));
      }
    } else {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_from a:not([date]):not([yawf-date])'));
      } else {
        return Array.from(feed.querySelectorAll('.from a:last-child:not(:first-child)'));
      }
    }
  };
  source.text = (feed, isMain) => {
    const domList = source.dom(feed, isMain);
    return domList.map(dom => {
      const text = (dom.title || dom.textContent).trim();
      return text;
    }).filter(source => source);
  };

  // 日期
  const date = feedParser.date = {};
  date.dom = (feed, isMain) => {
    const isSearch = isSearchFeedElement(feed);
    if (isMain === true) {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_detail > .WB_from a[date], .WB_detail > .WB_from a[yawf-date]'));
      } else {
        return Array.from(feed.querySelectorAll('.content > .from a:first-child'));
      }
    } else if (isMain === false) {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_expand .WB_from a[date], .WB_expand .WB_from a[yawf-date]'));
      } else {
        return Array.from(feed.querySelectorAll('.card-comment .from a:first-child'));
      }
    } else {
      if (!isSearch) {
        return Array.from(feed.querySelectorAll('.WB_from a[date], .WB_from a[yawf-date]'));
      } else {
        return Array.from(feed.querySelectorAll('.from a:first-child'));
      }
    }
  };
  date.date = (feed, isMain) => {
    const domList = date.dom(feed, isMain);
    return domList.map(dom => (
      new Date(Number(dom.getAttribute('date') || dom.getAttribute('yawf-date')))
    )).filter(date => +date);
  };

  // 其他基础通用
  feedParser.isFeed = feed => isFeedElement(feed);
  feedParser.isSearchFeed = feed => isSearchFeedElement(feed);
  feedParser.isForward = feed => isForwardFeedElement(feed);

  feedParser.mid = node => feedContainer(node).getAttribute('mid');
  feedParser.omid = node => feedContainer(node).getAttribute('omid');

  // 评论内容
  commentParser.text = target => {
    const elements = commentContentElements(target);
    if (elements) {
      const texts = elements.map(element => commentTextParser(element) || '');
      return texts.join('\n');
    } else {
      return commentTextParser(target);
    }
  };

  // 评论用户
  const commentUser = commentParser.user = {};
  commentUser.dom = comment => {
    return Array.from(comment.querySelectorAll('a[usercard]'));
  };
  commentUser.name = comment => {
    const domList = commentUser.dom(comment);
    return domList
      .map(dom => dom.textContent.trim().replace(/^@?/, ''))
      .filter(user => user);
  };

}());

