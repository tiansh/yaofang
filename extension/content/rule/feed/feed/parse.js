; (async function () {

  const yawf = window.yawf;

  const feedParser = yawf.feed = {};

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
    if (!(child instanceof Node)) {
      const children = Array.from(child);
      return children.every(child => contains(parent, child));
    }
    if (parent instanceof Node) {
      for (let e = child; e; e = e.parentElement) {
        if (e === parent) return true;
      }
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
    if (!element.matches('.WB_feed_type')) return false;
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
    const content = feed.querySelector('[node-type="feed_list_content"]');
    const contentFull = feed.querySelector('[node-type="feed_list_content_full"]');
    let post = contentFull ? !short ? [contentFull] : long ? [content, contentFull] : [content] : [content];
    if (detail) {
      const [author] = feedParser.author.dom(feed);
      const source = feed.querySelector('.WB_detail > .WB_from a:not([date])');
      const date = feed.querySelector('.WB_detail > .WB_from a[date]');
      post = [author, ...post, source, date];
    }
    let ori;
    if (feed.hasAttribute('omid')) {
      const reason = feed.querySelector('[node-type="feed_list_reason"]');
      const reasonFull = feed.querySelector('[node-type="feed_list_reason_full"]');
      let ori = reasonFull ? !short ? [reasonFull] : long ? [reason, reasonFull] : [reason] : [reason];
      if (detail) {
        const [original] = feedParser.original.dom(feed);
        const sourceOri = feed.querySelector('.WB_expand .WB_from a:not([date])');
        const dateOri = feed.querySelector('.WB_detail > .WB_from a[date]');
        ori = [original, ...ori, sourceOri, dateOri];
      }
      return [...post, null, ...ori];
    }
    return post;
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
    return node.closest('.WB_feed_type');
  };

  const textParser = function (detail) {
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
        const [_, superTopic, text] = topic.match(/^(\ue627?)\s*(.*)$/);
        if (superTopic && detail) return ` \ue627#${text}#`;
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
     * @作者（文本✗，正则✓）
     * @param {Element} node
     */
    const author = node => {
      if (!node.matches('.WB_detail > .WB_info > .W_fb[usercard]')) return null;
      if (!detail) return '';
      return '@' + node.title;
    };
    parsers.push(author);
    /**
     * @原作（文本✗，正则✓）
     * @param {Element} node
     */
    const original = node => {
      if (!node.matches('.WB_expand > .WB_info > .W_fb[usercard]')) return null;
      if (!detail) return '';
      return '@' + node.title;
    };
    parsers.push(original);
    /**
     * 来源（文本✗，正则✓）
     * @param {Element} node
     */
    const source = node => {
      if (!node.matches('.WB_from a:not([date])')) return null;
      if (!detail) return '';
      return (node.title || node.textContent).trim;
    };
    parsers.push(source);
    /**
     * 时间（文本✗，正则✓）
     * @param {Element} node
     */
    const timestamp = node => {
      if (!node.matches('a[date]')) return null;
      if (!detail) return '';
      const date = new Date(+node.getAttribute('date'));
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
    const parseNode = function parseNode(node) {
      const text = allParser(node);
      if (text) return text;
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
      const feed = feedContainer(commonParent(...rangeElements));
      if (!feed) return null;
      const elements = feedContentElements(feed, { detail, short: true, long: true });
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

  const fullTextParser = textParser(true);
  const simpleTextParser = textParser(false);

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

  // 作者（这条微博是谁发的）
  const author = feedParser.author = {};
  author.dom = feed => {
    if (!(feed instanceof Node)) return [];
    const author = feed.querySelector('.WB_detail > .WB_info > .W_fb[usercard]');
    return [author];
  };
  author.id = feed => {
    const doms = author.dom(feed);
    return doms.map(dom => {
      const id = new URLSearchParams(dom.getAttribute('usercard')).get('id');
      return id;
    });
  };
  author.name = feed => {
    const doms = author.dom(feed);
    return doms.map(dom => {
      const name = dom.title;
      return name;
    });
  };

  // 原作者（一条被转发的微博最早来自谁）
  const original = feedParser.original = {};
  original.dom = feed => {
    if (!(feed instanceof Node)) return [];
    const original = feed.querySelector('.WB_expand > .WB_info > .W_fb[usercard]');
    return original ? [original] : [];
  };
  original.id = feed => {
    const doms = original.dom(feed);
    return doms.map(dom => {
      const id = new URLSearchParams(dom.getAttribute('usercard')).get('id');
      return id;
    });
  };
  original.name = feed => {
    const doms = original.dom(feed);
    return doms.map(dom => {
      const name = dom.title;
      return name;
    });
  };

  // 提到（微博中提到的人，转发路径中的人同属于提到）
  const mention = feedParser.mention = {};
  mention.dom = (feed, { short = false, long = true } = {}) => {
    const contents = feedContentElements(feed, { short, long });
    const doms = [].concat(...contents.map(content => content.querySelectorAll(
      'a[href*="loc=at"][namecard*="name"]',
    )));
    return doms;
  };
  mention.name = (feed, { short = false, long = true } = {}) => {
    const doms = original.dom(feed, { short, long });
    return doms.map(dom => {
      const name = new URLSearchParams(dom.getAttribute('usercard')).get('name');
      return name;
    });
  };

  // 话题（包括话题和超话）
  const topic = feedParser.topic = {};
  topic.dom = (feed, { short = false, long = true } = {}) => {
    const contents = feedContentElements(feed, { short, long });
    const doms = [].concat(...contents.map(content => content.querySelectorAll(
      'a[suda-uatrack*="1022-topic"], a.a_topic',
    )));
    return doms;
  };
  topic.text = (feed, { short = false, long = true } = {}) => {
    const doms = topic.dom(feed, { short, long });
    return doms.map(dom => {
      const text = dom.title || dom.textContent;
      return text.replace(/[#\ue627]/g, '').trim();
    });
  };

  // 链接（除超话外所有的链接，包括外站链接、视频、文章等）
  const link = feedParser.link = {};
  link.dom = (feed, { short = false, long = true } = {}) => {
    const contents = feedContentElements(feed, { short, long });
    const doms = [].concat(...contents.map(content => content.querySelectorAll(
      'a[action-type="feed_list_url"]:not([suda-uatrack*="1022-topic"])',
    )));
    return doms;
  };
  link.text = (feed, { short = false, long = true } = {}) => {
    const doms = source.dom(feed, { short, long });
    return doms.map(dom => {
      const text = dom.title || dom.textContent;
      return text;
    });
  };

  // 来源
  const source = feedParser.source = {};
  source.dom = feed => {
    const doms = feed.querySelectorAll('.WB_from a:not([date])');
    return Array.from(doms);
  };
  source.text = feed => {
    const doms = source.dom(feed);
    return doms.map(dom => {
      const text = (dom.title || dom.textContent).trim();
      return text;
    }).filter(source => source);
  };

  // 其他基础通用
  feedParser.isFeed = feed => isFeedElement(feed);
  feedParser.isForward = feed => isForwardFeedElement(feed);

}());

