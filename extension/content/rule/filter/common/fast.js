; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const feedParser = yawf.feed;
  const commentParser = yawf.comment;
  const request = yawf.request;

  const i18n = util.i18n;

  const fast = feedParser.fast = {};
  const commentFast = commentParser.fast = {};

  Object.assign(i18n, {
    contentTextContextTitle: {
      cn: '过滤微博 内容“{1}”',
      tw: '篩選微博 內容「{1}」',
      en: 'Create filter for content “{1}”',
    },
    accountContextTitle: {
      cn: '过滤微博 帐号“{1}”',
      tw: '篩選微博 帳號「{1}」',
      en: 'Create filter for account “@{1}”',
    },
    topicContextTitle: {
      cn: '过滤微博 话题#{1}#',
      tw: '篩選微博 話題#{1}#',
      en: 'Create filter for topic #@{1}#',
    },
    sourceContextTitle: {
      cn: '过滤微博 来源“{1}”',
      tw: '篩選微博 來源「{1}」',
      en: 'Create filter for source “@{1}”',
    },
  });

  const recognize = fast.recognize = {};
  // 识别选中的文本
  recognize.textSimple = function (selection) {
    if (!(selection instanceof Selection)) return [];
    if (!(selection + '')) return [];
    if (selection.rangeCount !== 1) return [];
    let simple, full, type;
    simple = (feedParser.text.simple(selection) || []).map(t => t.trim());
    full = (feedParser.text.detail(selection) || []).map(t => t.trim());
    type = 'text';
    if (!simple.join('') && !full.join('')) {
      simple = full = (commentParser.text(selection) || []).map(t => t.trim());
      type = 'comment';
    }
    if (!simple.join('') && !full.join('')) {
      return [];
    }
    const template = i18n.contentTextContextTitle;
    const title = template.replace('{1}', () => simple);
    return [{ title, type, value: { simple, full } }];
  };
  rule.addFastListener(recognize.textSimple);

  // 识别多个选区选中的文本
  recognize.textComplex = function (selection) {
    if (!(selection instanceof Selection)) return [];
    if (selection.rangeCount <= 1) return [];
    let texts = feedParser.text.detail(selection).filter(text => text.trim());
    let type = 'multitext';
    if (!texts.length) {
      texts = commentParser.text(selection).filter(text => text.trim());
      type = 'multitextcomment';
    }
    if (!texts.length) {
      return [];
    }
    const template = i18n.contentTextContextTitle;
    texts = texts.map(text => text.trim());
    const joined = texts.join('…');
    const placeholder = joined.length > 10 ? joined.slice(0, 9) + '…' : joined;
    const title = template.replace('{1}', () => placeholder);
    return [{ title, type, value: { full: texts } }];
  };
  rule.addFastListener(recognize.textComplex);

  // 因为我们移除了对链接的识别，这里 将链接识别为文本
  recognize.textLink = function (target) {
    if (!(target instanceof Element)) return [];
    const container = document.createElement('body');
    container.appendChild(target.cloneNode(true));
    const link = container.querySelector([
      'a[action-type="feed_list_url"][title]',
      'a[action-type="fl_url_addparams"][title]',
    ].join(','));
    if (!link) return [];
    const text = link.title.trim();
    if (text.match(/^https?:/) || text === '网页链接') return [];
    const template = i18n.contentTextContextTitle;
    const title = template.replace('{1}', () => text);
    return [{ title, type: 'text', value: { simple: text, full: [text] } }];
  };
  rule.addFastListener(recognize.textLink);

  // 识别用户的头像、链接等
  recognize.account = async function (target) {
    if (!(target instanceof Element)) return [];
    const find = selector => target.querySelector(selector) || target.closest(selector);
    const user = { id: null, name: null, type: 'account' };
    // 用户链接
    ; (function (userlink) {
      if (!userlink) return;
      const params = new URLSearchParams(userlink.getAttribute('usercard'));
      if (params.has('id')) user.id = params.get('id');
      if (params.has('name')) user.name = params.get('name');
      if (userlink.matches('.WB_detail > .WB_info > .W_fb[usercard]')) user.type = 'author';
      if (userlink.matches('.WB_expand > .WB_info > .W_fb[usercard]')) user.type = 'original';
      if (userlink.matches('.WB_feed_type a[href*="loc=at"][usercard*="name"]')) user.type = 'mention';
      if (userlink.matches('[comment_id] [usercard]')) user.type = 'commentuser';
    }(find('[usercard*="name="], [usercard*="id="]')));
    // 个人主页的头像
    ; (function (photo) {
      if (!photo) return;
      user.name = photo.getAttribute('alt');
    }(find('.photo[alt]')));
    // 用户卡片头像
    ; (function (usercard) {
      if (!usercard) return;
      const avatar = usercard.querySelector('[imgtype="head"][uid][title]');
      if (!avatar) return;
      user.name = avatar.title;
      user.id = avatar.getAttribute('uid');
    }(find('.layer_personcard')));
    if (!user.id && !user.name) return [];
    if (!user.id || !user.name) try {
      Object.assign(user, await request.userInfo(user));
    } catch (e) { return []; }
    const template = i18n.accountContextTitle;
    if (!template) return [];
    const title = template.replace('{1}', () => user.name);
    return [{ title, type: user.type, value: { id: user.id, name: user.name } }];
  };
  rule.addFastListener(recognize.account);

  // 识别话题
  recognize.topic = async function (target) {
    if (!(target instanceof Element)) return [];
    let topic = null;
    if (target.matches('a[suda-uatrack*="1022-topic"]') && target.title) {
      topic = target.title.replace(/^[\s#]+|[\s#]+$/g, '');
    }
    if (!topic && target.matches('a.a_topic, a[suda-uatrack*="1022-topic"]')) {
      topic = target.textContent.replace(/^[\s#]+|[\s#]+$/g, '');
    }
    if (!topic && target.matches('a[suda-uatrack*="1022-stock"]')) {
      topic = target.textContent.replace(/^[\s$]+|[\s$]+$/g, '');
    }
    if (!topic && target.matches('.hot_topic a[title][suda-uatrack*="key=hottopic_r2"]')) {
      topic = target.title.replace(/^[\s#]+|[\s#]+$/g, '');
    }
    if (!topic) return [];
    const template = i18n.topicContextTitle;
    const title = template.replace('{1}', () => topic);
    return [{ title, type: 'topic', value: topic }];
  };
  rule.addFastListener(recognize.topic);

  // 识别来源
  recognize.source = async function (target) {
    if (!(target instanceof Element)) return [];
    if (!target.matches('.WB_from a:not([date]):not([yawf-date])')) return [];
    const source = (target.title || target.textContent).trim();
    if (!source || source === '微博 weibo.com') return [];
    const template = i18n.sourceContextTitle;
    const title = template.replace('{1}', () => source);
    return [{ title, type: 'source', value: source }];
  };
  rule.addFastListener(recognize.source);

  Object.assign(i18n, {
    textFastDescription: {
      cn: '包含“{1}”的微博',
      tw: '包含「{1}」的微博',
      en: 'Feeds contain text “{1}”',
    },
    textCommentFastDescription: {
      cn: '包含“{1}”的评论',
      tw: '包含「{1}」的評論',
      en: 'Comments contain text “{1}”',
    },
    regexFastDescription: {
      cn: '匹配{1}的微博',
      tw: '匹配{1}的微博',
      en: 'Feeds contain text “{1}”',
    },
    regexCommentFastDescription: {
      cn: '匹配{1}的评论',
      tw: '匹配{1}的評論',
      en: 'Comments contain text “{1}”',
    },
    accountAuthorFastDescription: {
      cn: '作者是“@{1}”的微博',
      tw: '作者是「@{1}」的微博',
      en: 'Feeds by "@{1}"',
    },
    accountAuthorForwardFastDescription: {
      cn: '作者是“@{1}”的转发微博',
      tw: '作者是「@{1}」的轉發微博',
      en: 'Feeds by "@{1}"',
    },
    accountMentionFastDescription: {
      cn: '提到了“@{1}”的微博',
      tw: '提到了「@{1}」的微博',
      en: 'Feeds mentioned "@{1}"',
    },
    accountOriginalFastDescription: {
      cn: '原作者是“@{1}”的微博',
      tw: '原作者是「@{1}」的微博',
      en: 'Original Feeds by "@{1}"',
    },
    accountCommentFastDescription: {
      cn: '包含“@{1}”的评论',
      tw: '包含「@{1}」的評論',
      en: 'Comments with "@{1}"',
    },
    topicFastDescription: {
      cn: '包含话题#{1}#的微博',
      tw: '包含话题#{1}#的微博',
      en: 'Feeds contain topic #{1}#',
    },
    sourceFastDescription: {
      cn: '来自“{1}”的微博',
      tw: '來自「{1}」的微博',
      en: 'Feeds from source “{1}”',
    },
  });

  const render = fast.render = {};
  const commentRender = commentFast.render = {};

  const textFastRender = function (description) {
    return function (item) {
      const container = document.createElement('span');
      const [pre, post] = description().split('{1}');
      container.appendChild(document.createTextNode(pre));
      const input = document.createElement('input');
      container.appendChild(input);
      container.appendChild(document.createTextNode(post));
      input.value = item.value = item.value.simple;
      input.addEventListener('input', event => {
        item.value = input.value;
      });
      return container;
    };
  };
  render.text = textFastRender(() => i18n.textFastDescription);
  commentRender.text = textFastRender(() => i18n.textCommentFastDescription);

  const regexEscaped = function (str) {
    return str.replace(/[.*+?^${}()|[\]/\\]/g, '\\$&');
  };
  const regexFastRender = function (description) {
    return function (item) {
      const container = document.createElement('span');
      const [pre, post] = description().split('{1}');
      container.appendChild(document.createTextNode(pre));
      const input = document.createElement('input');
      container.appendChild(input);
      container.appendChild(document.createTextNode(post));
      if (item.value.full.length === 1) {
        input.value = item.value = '/' + regexEscaped(item.value.full[0]) + '/mu';
      } else {
        input.value = item.value = '/^' + item.value.full
          .map(value => `(?=.*${regexEscaped(value)})`).join('') + '/mu';
      }
      input.addEventListener('input', event => {
        item.value = input.value;
      });
      return container;
    };
  };
  render.regex = regexFastRender(() => i18n.regexFastDescription);
  commentRender.regex = regexFastRender(() => i18n.regexCommentFastDescription);

  const simpleRender = function (template, readValue = value => value) {
    return function (item) {
      const container = document.createElement('span');
      const message = template().replace('{1}', () => readValue(item.value));
      container.appendChild(document.createTextNode(message));
      return container;
    };
  };

  render.author = simpleRender(() => i18n.accountAuthorFastDescription, value => value.name);
  render.forward = simpleRender(() => i18n.accountAuthorForwardFastDescription, value => value.name);
  render.mention = simpleRender(() => i18n.accountMentionFastDescription, value => value.name);
  render.original = simpleRender(() => i18n.accountOriginalFastDescription, value => value.name);
  commentRender.user = simpleRender(() => i18n.accountCommentFastDescription, value => value.name);
  render.topic = simpleRender(() => i18n.topicFastDescription);
  render.source = simpleRender(() => i18n.sourceFastDescription);

}());
