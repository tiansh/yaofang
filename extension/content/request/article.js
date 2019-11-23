; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const i18n = util.i18n;

  const ignoreError = function (callback) {
    try { return callback(); } catch (e) { /* ignore */ }
    return null;
  };

  const feedCard = function (mid) {
    const iframe = document.createElement('x-iframe');
    iframe.setAttribute('src', `https://card.weibo.com/article/v3/cardiframe?type=feed&id=${mid}`);
    iframe.className = 'card feed-card';
    return iframe;
  };

  const mediaCard = function (id) {
    const mediaType = { 100120: 'movie' }[id.slice(0, 6)];
    if (!mediaType) return null;
    const iframe = document.createElement('x-iframe');
    iframe.setAttribute('src', `https://card.weibo.com/article/v3/cardiframe?type=movie&id=1022:${id}`);
    iframe.className = `card media-card ${mediaType}-media-card`;
    return iframe;
  };

  const scriptVideo = function (script) {
    try {
      const match = script.match(/krv\.init\(\{(?:(?=.*src['"]?\s*:\s*(".*?(?!\\).")))(?:(?=.*poster['"]?\s*:\s*(".*?(?!\\).")))/);
      const [_, src, poster] = match;
      const video = document.createElement('video');
      video.controls = true;
      video.src = JSON.parse(src);
      video.poster = JSON.parse(poster);
      return video;
    } catch (e) {
      return null;
    }
  };

  const whiteListTags = [
    'a',
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ol', 'ul', 'li',
    'sup', 'sub',
    'img',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    'blockquote', 'quote',
    'br', 'hr',
    'span', 'div',
  ];
  const whiteListAttribute = tagName => [
    ...({
      img: ['src'],
    }[tagName] || []),
  ];
  const whiteListStyle = {
    'text-align': /^(?:left|right|center|justify)$/,
    'font-style': /^italic$/,
    'font-weight': /^bold$/,
    'text-decoration-line': /^(?:underline|line-through)$/,
    color: function (color) {
      try {
        const [r, g, b] = color.match(/rgba?\((.*)\)/)[1].split(',').map(Number);
        if (Math.max(r, g, b) < 45) return 'var(--text-color)';
        return `rgb(${r}, ${g}, ${b})`;
      } catch (e) {
        return null;
      }
    },
  };
  const parseSpecialElements = function (/** @type {HTMLElement} */container) {
    /** @type {Map<HTMLElement, HTMLElement>} */
    const placeholders = new Map();
    const replaceElement = (source, result) => {
      const placeholder = document.createElement('x-sanitize-placeholder');
      placeholders.set(placeholder, result);
      source.replaceWith(placeholder);
    };
    Array.from(container.querySelectorAll('.WB_feed[data-mid]')).forEach(element => {
      // 引用一条微博
      const card = ignoreError(() => feedCard(element.getAttribute('data-mid')));
      replaceElement(element, card);
    });
    Array.from(container.querySelectorAll('.cardbox')).forEach(element => {
      // 引用电影简介
      /** @type {HTMLAnchorElement} */
      const link = element.querySelector('a[href^="https://weibo.com/p/"]');
      if (link) {
        const id = link.href.split('/').pop();
        const media = id && ignoreError(() => mediaCard(id));
        replaceElement(element, media);
      }
    });
    Array.from(container.querySelectorAll('script')).forEach(element => {
      // 插入一段视频
      if (/krv.init\(\{.*\}\)/.test(element.textContent)) {
        const video = ignoreError(() => scriptVideo(element.textContent));
        replaceElement(element, video);
      }
      replaceElement(element, null);
    });
    return placeholders;
  };
  const sanitizeAnchorElement = function (element) {
    let url;
    try { url = element.href; } catch (e) { url = null; }
    if (!url || !['http:', 'https:'].includes(url.protocol)) {
      const span = document.createElement('span');
      return span;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.referrerPolicy = 'no-referrer';
    anchor.target = '_blank';
    return anchor;
  };
  const anotherTag = function (tagName, ori) {
    const result = document.createElement(tagName);
    if (ori.hasAttribute('style')) result.setAttribute('style', ori.getAttribute('style'));
    while (ori.firstChild) result.appendChild(ori.firstChild);
    ori.replaceWith(result);
    return result;
  };
  const sanitizeContent = function (/** @type {HTMLElement} */element) {
    const container = document.createElement('div');
    container.appendChild(element);
    const placeholders = parseSpecialElements(container);
    // 把属性换成 CSS
    [{ html: 'color', css: 'color' }, { html: 'align', css: 'textAlign' }].forEach(({ html, css }) => {
      [...container.querySelectorAll(`[${html}]`)].forEach(e => e.style[css] = e.getAttribute(html));
    });
    // 把 font 标签换成 span
    [...container.querySelectorAll('font')].forEach(e => {
      anotherTag('span', e);
    });
    // 把标签换成 CSS
    [
      { tag: 'b', css: { attr: 'font-weight', value: 'bold' } },
      { tag: 'del', css: { attr: 'text-decoration', value: 'line-through' } },
      { tag: 'em', css: { attr: 'font-style', value: 'italic' } },
      { tag: 'i', css: { attr: 'font-style', value: 'italic' } },
      { tag: 's', css: { attr: 'text-decoration', value: 'line-through' } },
      { tag: 'strike', css: { attr: 'text-decoration', value: 'line-through' } },
      { tag: 'strong', css: { attr: 'font-weight', value: 'bold' } },
      { tag: 'u', css: { attr: 'text-decoration', value: 'underline' } },
    ].forEach(({ tag, css: { attr, value } }) => {
      [...container.getElementsByTagName(tag)].forEach(e => {
        anotherTag('span', e).style.setProperty(attr, value);
      });
    });
    // 把图片配字换成 figure
    if (element.matches('.picbox')) do {
      const ori = element.querySelector('img[src]');
      const description = element.querySelector('.picinfo');
      if (!ori) break;
      const figure = document.createElement('figure');
      const img = figure.appendChild(document.createElement('img'));
      img.src = ori.src;
      const descriptionText = description && description.textContent.trim();
      if (descriptionText) {
        const figcaption = figure.appendChild(document.createElement('figcaption'));
        figcaption.textContent = descriptionText;
      }
      return [figure];
    } while (false);
    // 最后剩下的元素再做一次消毒
    return [...container.childNodes].map(function sanitize(node) {
      try {
        if (placeholders.has(node)) return placeholders.get(node);
        if (node.nodeType === Node.TEXT_NODE) {
          return document.createTextNode(node.textContent);
        }
        const element = node;
        if (element.nodeType !== Node.ELEMENT_NODE) return null;
        if (!(element instanceof HTMLElement)) return null;
        const oriTagName = element.tagName.toLowerCase();
        const tagName = whiteListTags.includes(oriTagName) ? oriTagName : 'span';
        if (tagName === 'a') {
          const anchor = sanitizeAnchorElement(element);
          Array.from(element.childNodes).forEach(node => anchor.appendChild(sanitize(node)));
          return anchor;
        }
        const result = document.createElement(tagName);
        const attributes = whiteListAttribute(tagName);
        Array.from(element.attributes).forEach(attribute => {
          if (attributes.includes(attribute.name)) {
            result.setAttribute(attribute.name, attribute.value);
          }
        });
        const style = element.style;
        Array.from(style).forEach(prop => {
          const value = style.getPropertyValue(prop);
          const testValue = whiteListStyle[prop];
          if (testValue instanceof RegExp) {
            if (!testValue.test(value)) return;
            result.style.setProperty(prop, value);
          } else if (typeof testValue === 'function') {
            const parsed = testValue(value);
            if (parsed === null) return;
            result.style.setProperty(prop, parsed);
          }
        });
        Array.from(element.childNodes).forEach(node => {
          const sanitized = sanitize(node);
          if (sanitized) result.appendChild(sanitized);
        });
        return result;
      } catch (e) {
        try {
          const result = document.createElement('span');
          Array.from(element.childNodes).forEach(node => {
            const sanitized = sanitize(node);
            if (sanitized) result.appendChild(sanitized);
          });
          return result;
        } catch (e2) {
          try {
            return document.createTextNode(node.textContent);
          } catch (e3) {
            return null;
          }
        }
      }
    }).filter(x => x);
  };

  const parseContent = function (/** @type {HTMLElement} */content) {
    const result = document.createElement('div');
    [...content.children].forEach(element => {
      sanitizeContent(element).forEach(node => result.appendChild(node));
    });
    return result.innerHTML;
  };

  const parseArticle = function (document) {
    const article = document.querySelector('[node-type="articleContent"]');
    const result = {};
    result.title = ignoreError(() => article.querySelector('[node-type="articleTitle"]').textContent);
    result.author = ignoreError(() => {
      const author = {};
      author.avatar = article.querySelector('.authorinfo img').src;
      author.name = article.querySelector('.authorinfo a').textContent.trim();
      author.uid = article.querySelector('.authorinfo a').href.split('/').pop();
      author.inner = ignoreError(() => {
        const inner = {};
        const author2 = article.querySelector('.authorinfo .author2in');
        if (!author2) return null;
        const link = author2.querySelector('a[href^="/u/"]');
        if (link) {
          inner.name = link.textContent.trim();
          inner.uid = link.href.split('/').pop();
        } else {
          inner.name = author2.textContent.trim().replace(/^\s*\S+\s+/, '');
        }
        return inner;
      });
      return author;
    });
    result.feed = ignoreError(() => {
      const fakeFeed = document.querySelector('.WB_feed [mid]');
      const mid = fakeFeed.getAttribute('mid');
      const comment = document.querySelector('[action-type="fl_comment"]');
      const ouid = new URLSearchParams(comment.getAttribute('action-data')).get('ouid');
      return `https://weibo.com/${ouid}/${util.mid.encode(mid)}`;
    });
    result.time = ignoreError(() => article.querySelector('.time').textContent);
    result.lead = ignoreError(() => article.querySelector('.preface').textContent);
    result.cover = ignoreError(() => document.querySelector('[node-type="articleHeaderPic"]').src);
    result.source = ignoreError(() => article.querySelector('.authorinfo .del a[suda-uatrack*="headline_pc_trend_ourl_click"]').href);
    result.createTime = ignoreError(() => article.querySelector('.time').textContent);
    result.content = ignoreError(() => parseContent(article.querySelector('[node-type="contentBody"]')));
    return result;
  };

  const getArticle = async function (id) {
    const url = 'https://weibo.com/ttarticle/p/show?id=' + id;
    util.debug('fetch url %s', url);
    const resp = await network.fetchText(url);
    /** @type {HTMLDocument} */
    const dom = new DOMParser().parseFromString(resp, 'text/html');
    return parseArticle(dom);
  };
  request.getArticle = getArticle;

  const getArticleCard = async function (src) {
    util.debug('fetch url %s', src);
    const oriHtml = await network.fetchText(src);
    const html = oriHtml.replace(/<head>/, '<head><base target="_blank" href="https://card.weibo.com/" /><meta name="referrer" content="no-referrer" />');
    return html;
  };
  request.getArticleCard = getArticleCard;

}());
