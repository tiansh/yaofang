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
      const { addClass, setAttribute } = Nodes;

      addClass(nodeStruct, 'yawf-feed-head');

      // 用户头像
      const avatar = nodeStruct.querySelector('x-woo-avatar').parentNode;
      if (avatar) addClass(avatar, 'yawf-feed-avatar');
      if (newTab.author) {
        if (avatar) setAttribute(avatar, 'target', '_blank');
      }
      // 用户昵称
      const userLink = nodeStruct.querySelector('span').closest('x-a-link');
      if (userLink) addClass(userLink, 'yawf-feed-author');
      if (newTab.author) setAttribute(userLink, 'target', '_blank');
      const userLine = nodeStruct.querySelector('span').closest('x-woo-box');
      if (userLine) {
        addClass(userLine, 'yawf-feed-author-line');
        addClass(userLine.parentNode, 'yawf-feed-author-box');
      }
      // 快转
      if (Array.isArray(this.screen_name_suffix_new) && this.screen_name_suffix_new.length) {
        // TODO 微博目前快转的作者名不是链接，估计是 bug，先等等再看怎么处理
      }
      // 标记一下时间和来源
      const headInfo = nodeStruct.querySelector('x-head-info');
      addClass(headInfo, 'yawf-feed-head-info');
    });

    vueSetup.transformComponentsRenderByTagName('head-info', function (nodeStruct, Nodes) {
      const { h, insertBefore, removeChild, addClass, removeEventListener, setAttribute } = Nodes;

      addClass(nodeStruct, 'yawf-head-info');
      // 微博详情
      /** @type {HTMLAnchorElement} */
      const link = nodeStruct.querySelector('a');
      addClass(link, 'yawf-feed-time');
      if (newTab.detail) {
        removeEventListener(link, 'click');
        setAttribute(link, 'target', '_blank');
      }

      const tag = link.previousSibling;
      if (tag) addClass(tag, 'yawf-feed-tag');

      const sourceBox = nodeStruct.querySelector('x-woo-box-item x-woo-box');
      const [source, edited] = sourceBox.childNodes;

      // 替换掉原有的来源，保证来源本身有个标签，后续用来做拖拽过滤用
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

      // 作者等
      const headInfo = nodeStruct.querySelector('x-head-info');
      if (headInfo) {
        addClass(headInfo, 'yawf-feed-head-info yawf-feed-head-info-retweet');
        const headInfoVNode = vNode(headInfo);
        if (headInfoVNode.componentOptions.propsData) {
          headInfoVNode.componentOptions.propsData.source = this.data.source;
        }
      }

      // 内容
      addClass(nodeStruct, 'yawf-feed-content');
      if (headInfo) {
        addClass(nodeStruct, 'yawf-feed-content-retweet');
      }

      // 提示横幅
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
      const [authorBox, content] = nodeStruct.childNodes;

      // 原作者
      if (authorBox && authorBox.nodeType !== Node.COMMENT_NODE) {
        const author = authorBox.querySelector('x-a-link');
        addClass(author, 'yawf-feed-original');
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

    // 视频
    vueSetup.transformComponentsRenderByTagName('feed-video', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      addClass(nodeStruct, 'yawf-feed-video');
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-link', function (nodeStruct, Nodes) {
      const { addClass, setAttribute } = Nodes;
      // 其他卡片
      addClass(nodeStruct, 'yawf-feed-card-link');
      if (newTab.card) setAttribute(nodeStruct, 'target', '_blank');
      const card = nodeStruct.firstChild;
      addClass(card, 'yawf-feed-card');
      const [picture, content] = card.childNodes;
      addClass(picture, 'yawf-feed-card-picture');
      addClass(content, 'yawf-feed-card-content');
    });

    vueSetup.transformComponentsRenderByTagName('feed-article', function (nodeStruct, Nodes) {
      const { addClass, setAttribute } = Nodes;
      addClass(nodeStruct, 'yawf-feed-card-article-link');
      addClass(nodeStruct.firstChild, 'yawf-feed-card-article');
      if (newTab.card) setAttribute(nodeStruct, 'target', '_blank');
    });

    vueSetup.transformComponentsRenderByTagName('feed-vote', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      addClass(nodeStruct, 'yawf-feed-card-vote');
    });

    vueSetup.transformComponentsRenderByTagName('feed-toolbar', function (nodeStruct, Nodes) {
      const { addClass, vNode, removeChild, insertBefore, addEventListener } = Nodes;

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
            const retweetButtonVNode = popVNode.data.scopedSlots.ctrl()[0];
            const oriRetweetButton = pop.querySelector('x-woo-pop-item:nth-child(2)');
            retweetButtonVNode.data.on = vNode(oriRetweetButton).data.on;
            retweetButtonVNode.data.nativeOn = vNode(oriRetweetButton).data.nativeOn;
            const contain = pop.parentNode;
            insertBefore(contain.parentNode, retweetButtonVNode, contain);
            removeChild(contain.parentNode, contain);
          } catch (e) {
            // ignore
          }
        }
      }
    });

    const repostCommentListRanderTransform = function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode, addClass, setAttribute } = Nodes;

      // 查看全部评论
      const more = nodeStruct.querySelector('x-woo-divider + x-woo-box');
      if (more) {
        if (more.matches('x-a-link, x-a-link *')) { // 回头看看他们加不加这个链接再决定怎么办
          const link = more.closest('x-a-link') || more;
          addClass(link, 'yawf-feed-comment-more');
          if (newTab.comments) setAttribute(link, 'target', '_blank');
        } else {
          const linkVNode = h('a', {
            class: 'yawf-feed-comment-more yawf-extra-link',
            attrs: {
              href: absoluteUrl(`/${this.data.user.id}/${this.data.mblogid}#${this.curTab}`),
            },
          });
          wrapNode(more, linkVNode);
          configClickHandler(vNode(more), linkVNode, newTab.comments);
        }
      }
    };
    vueSetup.transformComponentsRenderByTagName('repost-comment-feed', repostCommentListRanderTransform);
    vueSetup.transformComponentsRenderByTagName('repost-comment-list', repostCommentListRanderTransform);

    vueSetup.transformComponentsRenderByTagName('reply-modal', function (nodeStruct, Nodes) {
      const reply = this;
      const { transformSlot } = Nodes;
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
      const { vNode, addClass, setAttribute } = Nodes;

      addClass(nodeStruct, 'yawf-feed-comment');

      const [avatar, author, ...replyAuthors] = nodeStruct.querySelectorAll('x-a-link');
      if (avatar) {
        addClass(avatar, 'yawf-feed-comment-avatar');
        if (newTab.comments) setAttribute(avatar, 'target', '_blank');
      }
      // 评论作者
      if (author) {
        addClass(author, 'yawf-feed-comment-author');
        if (newTab.comments) setAttribute(author, 'target', '_blank');
      }
      // 二级评论作者
      if (replyAuthors && replyAuthors.length) {
        replyAuthors.forEach((author, index) => {
          if (!comment.comments || !comment.comments[index]) return;
          addClass(author, 'yawf-feed-comment-author', 'yawf-feed-comment-reply-author');
        });
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

      // 评论的操作按钮
      const iconLists = Array.from(nodeStruct.querySelectorAll('x-icon-list'));
      iconLists.forEach(iconList => {
        addClass(iconList, 'yawf-feed-comment-icon-list');
      });
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
      const { setAttribute } = Nodes;

      const iconsName = this.iconsName;
      const iconsNode = Array.from(nodeStruct.childNodes);
      if (!Array.isArray(iconsName)) return;
      if (iconsName.length !== iconsNode.length) return;
      iconsNode.forEach((node, index) => {
        setAttribute(node, 'yawf-icon-list-name', iconsName[index].name);
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
      configs.newTab = Object.assign(...'author,mention,topic,detail,comments,picture,card'.split(',').map(id => ({
        [id]: feeds.details.feedLinkNewTab.getConfig() && feeds.details.feedLinkNewTab.ref[id].getConfig(),
      })));
      configs.hideFastRepost = clean.feed.fast_repost.getConfig();
      util.debug('render config: %o', configs);

      util.inject(renderModify, util.inject.rootKey, configs);

      css.append(`
.yawf-extra-link, .yawf-extra-box { all: inherit; display: contents; }
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
