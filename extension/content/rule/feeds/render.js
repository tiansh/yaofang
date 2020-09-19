; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const feeds = yawf.rules.feeds;
  const clean = yawf.rules.clean;

  const i18n = util.i18n;
  const css = util.css;

  const render = feeds.render = {};

  i18n.feedRenderGroupTitle = { cn: '渲染' };

  render.render = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedRenderGroupTitle,
  });

  Object.assign(i18n, {
    feedRenderFix: {
      cn: '修改微博显示逻辑以允许相关改造功能 {{i}}',
    },
    feedRenderFixDetail: {
      cn: '如果因为微博的改版导致该功能故障，请停用该选项。只有打开该选项才能使用大部分对微博的改造功能。打开后会有一些细节上的变化，作者等处会显示为链接，转发的原微博会显示来源，微博下的转发列表可以点击时间跳转到该微博。',
    },
  });

  const renderModify = function (rootKey, configs) {
    const yawf = window[rootKey];
    const vueSetup = yawf.vueSetup;

    const { smallImage, newTab } = configs;

    const absoluteUrl = function (url) {
      const base = location.host === 'www.weibo.com' ? '//www.weibo.com/' : '//weibo.com/';
      return new URL(url, new URL(base, location.href)).href;
    };
    const setHref = function (vnode, url) {
      if (!vnode.data) vnode.data = {};
      if (!vnode.data.attrs) vnode.data.attrs = {};
      vnode.data.attrs.href = url;
    };

    const removeClickHandler = function (vnode) {
      if (!vnode.data || !vnode.data.on) return null;
      const onclick = vnode.data.on.click;
      delete vnode.data.on.click;
      return onclick;
    };
    const addClickHandler = function (vnode, onclick) {
      if (!vnode.data) vnode.data = {};
      if (!vnode.data.on) vnode.data.on = {};
      vnode.data.on.click = onclick;
    };
    const muteClickHandler = function (vnode) {
      const onclick = removeClickHandler(vnode);
      if (!onclick) return;
      addClickHandler(vnode, function (event) {
        if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return;
        if (event.buttons !== 1) return;
        event.preventDefault();
        onclick(event);
      });
    };
    const configClickHandler = function (vnode, link, newTab) {
      if (newTab) {
        removeClickHandler(vnode);
        if (!link.data) link.data = {};
        if (!link.data.attrs) link.data.attrs = {};
        link.data.attrs.target = '_blank';
      } else {
        muteClickHandler(vnode);
      }
    };

    document.documentElement.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('.yawf-feed-detail-content-handler a[href]');
      if (!link) return;
      if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) {
        event.stopPropagation();
      }
      const isPicture = link.hasAttribute('data-pid');
      const isMention = link.getAttribute('href').startsWith('/n/');
      if (isPicture ? newTab.picture : isMention ? newTab.mention : newTab.topic) {
        event.stopPropagation();
      }
    }, { capture: true });

    // 给提到和话题的链接加上新标签页打开的标记
    const handleContentRender = function (content) {
      if (!((content.data || {}).domProps || {}).innerHTML) return;
      const tag = 'x-content-parse-wrap-x' + (Math.random() + '').slice(2);
      const wrap = new DOMParser().parseFromString(`<${tag}>` + content.data.domProps.innerHTML, 'text/html').querySelector(tag);
      [...wrap.querySelectorAll('a')].forEach(link => {
        if (link.target === '_blank') return;
        const isPicture = link.hasAttribute('data-pid');
        const isMention = link.getAttribute('href').startsWith('/n/');
        if (isPicture ? newTab.picture : isMention ? newTab.mention : newTab.topic) {
          link.target = '_blank';
        }
      });
      Object.assign(content.data.domProps, { innerHTML: wrap.innerHTML });
    };

    vueSetup.transformComponentsRenderByTagName('feed-head', function (nodeStruct, Nodes) {

      const { h, wrapNode, vNode, addClass } = Nodes;

      addClass(nodeStruct, 'yawf-feed-head');

      // 用户头像得是链接
      const avatar = nodeStruct.querySelector('x-woo-avatar');
      const userAvatarLinkVNode = h('a', {
        class: 'yawf-feed-avatar yawf-extra-link',
        attrs: { href: absoluteUrl(this.userInfo.profile_url) },
      });
      wrapNode(avatar, userAvatarLinkVNode);
      configClickHandler(vNode(avatar), userAvatarLinkVNode, newTab.author);

      // 用户昵称更得是链接
      const userSpan = nodeStruct.querySelector('span');
      const userLinkVNode = h('a', {
        class: 'yawf-feed-author yawf-extra-link',
        attrs: { href: absoluteUrl(this.userInfo.profile_url) },
      });
      const userNode = wrapNode(userSpan, userLinkVNode);
      configClickHandler(vNode(userSpan), userLinkVNode, newTab.author);
      addClass(userNode.parentNode, 'yawf-feed-author-line');
      addClass(userNode.parentNode.parentNode, 'yawf-feed-author-box');

      // 快转的作者也是链接形式
      if (Array.isArray(this.screen_name_suffix_new)) {
        this.screen_name_suffix_new.forEach((item, index) => {
          if (typeof item.scheme !== 'string') return;
          if (!item.scheme.startsWith('sinaweibo://userinfo')) return;
          const span = userNode.parentNode.childNodes[index];
          if (!index || !span) return;
          if (!item.scheme) return;
          const refId = new URL(item.scheme).searchParams.get('uid');
          const linkVNode = h('a', {
            class: 'yawf-feed-fast-author yawf-extra-link',
            attrs: { href: absoluteUrl(`/u/${refId}`) },
          });
          wrapNode(span, linkVNode);
          configClickHandler(vNode(span), linkVNode, newTab.author);
        });
      }

      // “被”和“快转了”几个字不应该点了跳转到错误页面
      if (Array.isArray(this.screen_name_suffix_new)) {
        Array.from(userNode.parentNode.children).forEach(item => {
          removeClickHandler(vNode(item));
        });
      }

      // 标记一下时间和来源
      const headInfo = nodeStruct.querySelector('x-feed-head-info');
      addClass(headInfo, 'yawf-feed-head-info');
    });

    vueSetup.transformComponentsRenderByTagName('feed-head-info', function (nodeStruct, Nodes) {
      const { h, insertBefore, removeChild, addClass, vNode } = Nodes;

      // 微博详情
      const link = nodeStruct.querySelector('a');
      addClass(link, 'yawf-feed-time');
      configClickHandler(vNode(link), vNode(link), newTab.detail);

      // 来源用个 span 套起来
      const sourceBox = nodeStruct.querySelector('x-woo-box-item x-woo-box');
      const [source, edited] = sourceBox.childNodes;
      if (source && source.nodeType !== Node.COMMENT_NODE) {
        const newSourceVNode = h('div', {
          class: [this.$style.source, 'yawf-feed-source-container'],
        }, ['来自 ', h('span', {
          class: ['yawf-feed-source'],
          attrs: { draggable: 'true' },
        }, [this.source || '微博 weibo.com'])]);
        insertBefore(sourceBox, newSourceVNode, source);
        removeChild(sourceBox, source);
      }

      // 已编辑
      if (edited && edited.nodeType !== Node.COMMENT_NODE) {
        addClass(edited, 'yawf-feed-edited');
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-content', function (nodeStruct, Nodes) {
      const { vNode, addClass, wrapNode, h } = Nodes;

      const headInfo = nodeStruct.querySelector('x-feed-head-info');
      if (headInfo) {
        addClass(headInfo, 'yawf-feed-head-info yawf-feed-head-info-retweet');
        const headInfoVNode = vNode(headInfo);
        if (headInfoVNode.componentOptions.propsData) {
          headInfoVNode.componentOptions.propsData.source = this.data.source;
        }
      }

      addClass(nodeStruct, 'yawf-feed-content');
      if (headInfo) {
        addClass(nodeStruct, 'yawf-feed-content-retweet');
      }

      const tip = nodeStruct.querySelector('x-woo-tip');
      if (tip) {
        addClass(tip, 'yawf-feed-content-tip');
        if (this.data.complaint && this.data.complaint.url) {
          const linkVNode = h('a', {
            class: 'yawf-feed-content-tip-link yawf-extra-link',
            attrs: { href: absoluteUrl(this.data.complaint.url) },
          });
          wrapNode(tip, linkVNode);
          configClickHandler(vNode(tip), linkVNode, true);
        }
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-detail', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode, addClass } = Nodes;
      const [author, content] = nodeStruct.childNodes;

      // 原作者也是链接
      if (author && author.nodeType !== Node.COMMENT_NODE) {
        const span = author.querySelector('span');
        const linkVNode = h('a', {
          class: 'yawf-feed-original yawf-extra-link',
          attrs: { href: absoluteUrl(this.user.profile_url) },
        });
        const userNode = wrapNode(span, linkVNode);
        configClickHandler(vNode(span), linkVNode, newTab.author);
        addClass(userNode.parentNode, 'yawf-feed-original-line');
      }

      // 内容
      if (content && content.nodeType !== Node.COMMENT_NODE) {
        addClass(content, 'yawf-feed-detail-content');
        if (this.repost) {
          addClass(content, 'yawf-feed-detail-content-retweet');
        }
        handleContentRender(vNode(content));
        addClass(content, 'yawf-feed-detail-content-handler');
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-picture', function (nodeStruct, Nodes) {
      const { addClass, vNode } = Nodes;
      // 微博配图
      addClass(nodeStruct, 'yawf-feed-picture');
      // 每行三张图或四张图
      if (this.inlineNum === 3) {
        addClass(nodeStruct, 'yawf-feed-picture-col3');
      } else if (this.inlineNum === 4) {
        addClass(nodeStruct, 'yawf-feed-picture-col4');
      }
      // 单张图片
      if (this.isSinglePic) {
        addClass(nodeStruct, 'yawf-feed-picture-single');
        // 缩小单张图片，V5 版单张图片的尺寸不超过 120x120
        if (smallImage) {
          const oriWidth = this.isPay && this.pics[0] && this.pics[0].width ? this.pics[0].width : this.pics[0].geo && this.pics[0].geo.width;
          const oriHeight = this.isPay && this.pics[0] && this.pics[0].height ? this.pics[0].height : this.pics[0].geo && this.pics[0].geo.height;
          const width = Math.min(120, Math.max(120 / oriHeight * oriWidth, 30));
          const height = Math.min(120, Math.max(120 / oriWidth * oriHeight, 30));
          const style = vNode(nodeStruct.firstChild).data.style;
          style.width = width + 'px';
          style.height = height + 'px';
        }
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-video', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      // 视频
      addClass(nodeStruct, 'yawf-feed-video');
      if (this.isPlaying) {
        addClass(nodeStruct, 'yawf-feed-video-actived');
      } else {
        addClass(nodeStruct, 'yawf-feed-video-inactive');
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-link', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      // 其他卡片
      addClass(nodeStruct, 'yawf-feed-card');
      const [picture, content] = nodeStruct.childNodes;
      addClass(picture, 'yawf-feed-card-picture');
      addClass(content, 'yawf-feed-card-content');
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-article', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      addClass(nodeStruct, 'yawf-feed-card-article');
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-vote', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      addClass(nodeStruct, 'yawf-feed-card-vote');
    });

    vueSetup.transformComponentsRenderByTagName('feed-toolbar', function (nodeStruct, Nodes) {
      const { addClass, vNode, removeChild, insertBefore } = Nodes;

      addClass(nodeStruct, 'yawf-feed-toolbar');

      // 操作按钮
      const buttons = [...nodeStruct.querySelectorAll('x-woo-box-item')];
      if (buttons.length === 3) {
        const [retweet, comment, like] = buttons;
        addClass(retweet, 'yawf-feed-toolbar-retweet');
        addClass(comment, 'yawf-feed-toolbar-comment');
        addClass(like, 'yawf-feed-toolbar-like');

        if (configs.hideFastRepost) {
          try {
            const pop = retweet.querySelector('x-woo-pop');
            const popVNode = vNode(pop);
            const retweetButton = popVNode.data.scopedSlots.ctrl()[0];
            const oriRetweetButton = pop.querySelector('x-woo-pop-item:nth-child(2)');
            const retweetOnClick = vNode(oriRetweetButton).data.nativeOn.click;
            if (!retweetButton.data) retweetButton.data = {};
            if (!retweetButton.data.on) retweetButton.data.on = {};
            if (!retweetButton.data.nativeOn) retweetButton.data.nativeOn = {};
            retweetButton.data.on.click = retweetButton.data.nativeOn.click = retweetOnClick;
            const contain = pop.parentNode;
            insertBefore(contain.parentNode, retweetButton, contain);
            removeChild(contain.parentNode, contain);
          } catch (e) {
            // ignore
          }
        }
      }
    });

    const repostCommentListRanderTransform = function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode } = Nodes;

      // 查看全部评论
      const more = nodeStruct.querySelector('x-woo-divider + x-woo-box');
      if (more) {
        const linkVNode = h('a', {
          class: 'yawf-feed-comment-more yawf-extra-link',
          attrs: {
            href: absoluteUrl(`/${this.data.user.id}/${this.data.mblogid}#${this.curTab}`),
          },
        });
        wrapNode(more, linkVNode);
        configClickHandler(vNode(more), linkVNode, newTab.comments);
      }
    };
    vueSetup.transformComponentsRenderByTagName('repost-comment-feed', repostCommentListRanderTransform);
    vueSetup.transformComponentsRenderByTagName('repost-comment-list', repostCommentListRanderTransform);

    vueSetup.transformComponentsRenderByTagName('reply-modal', function (nodeStruct, Nodes) {
      const reply = this;
      const { transformSlot, addClass } = Nodes;
      transformSlot(nodeStruct, 'content', function (nodeStruct) {
        commentRenderTransformHelper(nodeStruct, reply.rootComment, Nodes);
      });
    });

    vueSetup.transformComponentsRenderByTagName('reply', function (nodeStruct, Nodes) {
      commentRenderTransformHelper(nodeStruct, this.item, Nodes);
    });

    vueSetup.transformComponentsRenderByTagName('main-composer', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode } = Nodes;

      // 发帖头像
      const avatar = nodeStruct.querySelector('x-woo-avatar');
      if (avatar) {
        const linkVNode = h('a', {
          class: 'yawf-feed-composer-avatar yawf-extra-link',
          attrs: { href: absoluteUrl(this.config.user.profile_url) },
        });
        wrapNode(avatar, linkVNode);
        configClickHandler(vNode(avatar), linkVNode, newTab.author);
      }
    });

    const commentRenderTransformHelper = function (nodeStruct, comment, Nodes) {
      const { h, wrapNode, vNode, addClass } = Nodes;

      addClass(nodeStruct, 'yawf-feed-comment');

      const [author, ...replyAuthors] = nodeStruct.querySelectorAll('a');
      // 评论作者
      if (author) {
        const vnode = vNode(author);
        setHref(vnode, absoluteUrl(comment.user.profile_url));
        configClickHandler(vnode, vnode, newTab.author);
      }
      // 二级评论作者
      if (replyAuthors && replyAuthors.length) {
        replyAuthors.forEach((author, index) => {
          if (!comment.comments || !comment.comments[index]) return;
          const item = comment.comments[index];
          const vnode = vNode(author);
          setHref(vnode, absoluteUrl(item.user.profile_url));
          configClickHandler(vnode, vnode, newTab.author);
        });
      }

      // 只有一级评论的作者有头像
      const avatar = nodeStruct.querySelector('x-woo-avatar');
      if (avatar) {
        const vnode = vNode(avatar);
        const linkVNode = h('a', {
          class: 'yawf-feed-comment-avatar yawf-extra-link',
          attrs: { href: absoluteUrl(comment.user.profile_url) },
        });
        wrapNode(avatar, linkVNode);
        configClickHandler(vnode, vnode, newTab.author);
      }

      // 评论的内容
      const contentList = [...nodeStruct.querySelectorAll('span')];
      contentList.forEach(content => {
        if (!Object.prototype.hasOwnProperty.call((vNode(content).data || {}).domProps || {}, 'innerHTML')) return;
        addClass(content, 'yawf-feed-comment-content');
        addClass(content.parentNode, 'yawf-feed-comment-text');
        handleContentRender(vNode(content));
        addClass(content, 'yawf-feed-detail-content-handler');
      });

      // 带图评论
      const picture = nodeStruct.querySelector('x-woo-picture');
      if (picture) addClass(picture, 'yawf-feed-comment-picture');

      // 某条评论下的所有评论
      const moreIcon = nodeStruct.querySelector('a > x-woo-fonticon');
      if (moreIcon) {
        addClass(moreIcon.parentNode, 'yawf-feed-comment-more');
      }

      const iconList = nodeStruct.querySelector('x-icon-list');
      if (iconList) addClass(iconList, 'yawf-feed-comment-icon-list');
    };
    vueSetup.transformComponentsRenderByTagName('comment', function (nodeStruct, Nodes) {
      commentRenderTransformHelper(nodeStruct, this.item, Nodes);
    });

    vueSetup.transformComponentsRenderByTagName('repost', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode, addClass } = Nodes;

      addClass(nodeStruct, 'yawf-feed-repost');

      // 转发作者
      const author = nodeStruct.querySelector('a');
      if (author) {
        setHref(vNode(author), absoluteUrl(this.item.user.profile_url));
        configClickHandler(vNode(author), vNode(author), newTab.author);
      }

      // 头像
      const avatar = nodeStruct.querySelector('x-woo-avatar');
      if (avatar) {
        const linkVNode = h('a', {
          class: 'yawf-feed-comment-avatar yawf-extra-link',
          attrs: { href: absoluteUrl(this.item.user.profile_url) },
        });
        wrapNode(avatar, linkVNode);
        configClickHandler(vNode(avatar), linkVNode, newTab.author);
      }

      // 转发正文
      const content = nodeStruct.querySelector('span');
      if (content) {
        addClass(content, 'yawf-feed-repost-content');
        addClass(content.parentNode, 'yawf-feed-repost-text');
        handleContentRender(vNode(content));
        addClass(content, 'yawf-feed-detail-content-handler');
      }

      // 转发微博原来点哪里都可以，我们让他只点时间
      const showRepost = removeClickHandler(vNode(nodeStruct));

      // 转发微博的时间
      const time = content && content.parentNode.nextSibling.querySelector('div');
      addClickHandler(vNode(time), showRepost);
      if (time) {
        const linkVNode = h('a', {
          class: 'yawf-feed-repost-time yawf-extra-link',
          attrs: {
            href: absoluteUrl(`/${this.item.user.id}/${this.item.mblogid}`),
          },
        });
        wrapNode(time, linkVNode);
        configClickHandler(vNode(time), linkVNode, newTab.detail);
      }
    });

    vueSetup.transformComponentsRenderByTagName('icon-list', function (nodeStruct, Nodes) {
      const { vNode } = Nodes;

      const iconsName = this.iconsName;
      const iconsNode = Array.from(nodeStruct.childNodes);
      if (!Array.isArray(iconsName)) return;
      if (iconsName.length !== iconsNode.length) return;
      iconsNode.forEach((node, index) => {
        const vnode = vNode(node);
        vnode.data.attrs['yawf-icon-list-name'] = iconsName[index].name;
      });
    });
  };

  render.feedRenderFix = rule.Rule({
    weiboVersion: 7,
    id: 'feed_render',
    version: 77,
    parent: render.render,
    initial: true,
    template: () => i18n.feedRenderFix,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.feedRenderFixDetail },
    },
    ainit() {
      const configs = {};

      configs.smallImage = feeds.layout.smallImage.getConfig();
      configs.newTab = Object.assign(...'author,mention,topic,detail,comments,picture'.split(',').map(id => ({
        [id]: feeds.details.feedLinkNewTab.getConfig() && feeds.details.feedLinkNewTab.ref[id].getConfig(),
      })));
      util.debug('render config: %o', configs);
      configs.hideFastRepost = clean.feed.fast_repost.getConfig();

      util.inject(renderModify, util.inject.rootKey, configs);

      css.append(`
.yawf-extra-link { all: inherit; display: contents; }
.yawf-feed-source { cursor: default; }
.yawf-feed-repost.yawf-feed-repost { cursor: auto; }
.yawf-feed-repost-time { cursor: pointer; color: var(--w-sub); }
.yawf-feed-source:hover, .yawf-feed-repost-time:hover { color: var(--w-brand); }
.yawf-feed-head-info-retweet { overflow: hidden; }
.yawf-feed-head-info-retweet ~ .yawf-feed-toolbar { flex-shrink: 0; }
`);

    },
  });

}());
