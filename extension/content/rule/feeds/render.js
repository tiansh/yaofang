; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const feeds = yawf.rules.feeds;

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
      cn: '允许脚本修改微博显示逻辑以允许相关改造功能 {{i}}',
    },
    feedRenderFixDetail: {
      cn: '如果因为微博的改版导致该功能故障，请停用该选项。只有打开该选项才能使用大部分对微博的改造功能。打开后作者等处会显示为链接，转发原微博会显示来源。此外不会有明显的变化。',
    },
  });

  const renderModify = function (rootKey, configs) {
    const yawf = window[rootKey];
    const vueSetup = yawf.vueSetup;
    const absoluteUrl = function (url) {
      const base = location.host === 'www.weibo.com' ? '//www.weibo.com/' : '//weibo.com/';
      return new URL(url, new URL(base, location.href)).href;
    };

    const configClickHandler = function (vnode) {
      if (!vnode.data || !vnode.data.on) return;
      vnode.data.on.click = (function (onclick) {
        return function (event) {
          // 按住 Ctrl 或 Shift 的时候不在当前页面打开，所以不走默认的处理逻辑比较好
          if (event.ctrlKey || event.shiftKey || event.metaKey) return;
          event.preventDefault();
          onclick(event);
        };
      }(vnode.data.on.click));
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
      const avatarNode = wrapNode(avatar, userAvatarLinkVNode);
      configClickHandler(vNode(avatar));

      // 用户昵称更得是链接
      const userSpan = nodeStruct.querySelector('span');
      const userLinkVNode = h('a', {
        class: 'yawf-feed-author yawf-extra-link',
        attrs: { href: absoluteUrl(this.userInfo.profile_url) },
      });
      const userNode = wrapNode(userSpan, userLinkVNode);
      configClickHandler(vNode(userSpan));
      addClass(userNode.parentNode, 'yawf-feed-author-line');
      addClass(userNode.parentNode.parentNode, 'yawf-feed-author-box');

      // 快转的作者也是链接形式
      if (this.screen_name_suffix_new) do {
        const index = this.screen_name_suffix_new.findIndex(item => item.type === 2);
        const item = this.screen_name_suffix_new[index];
        const span = userNode.parentNode.childNodes[index];
        const feed = vueSetup.closest(this, 'feed');
        if (!index || !span || !feed) break;
        if (!item.scheme) break;
        const refId = new URL(item.scheme).searchParams.get('uid');
        const linkVNode = h('a', {
          class: 'yawf-feed-fast-author yawf-extra-link',
          attrs: { href: absoluteUrl(`/u/${refId}`) },
        });
        wrapNode(span, linkVNode);
        configClickHandler(vNode(span));
      } while (false);

      // “被”和“快转了”几个字不应该点了跳转到错误页面
      if (this.screen_name_suffix_new && this.screen_name_suffix_new.length) {
        Array.from(userNode.parentNode.children).forEach(item => {
          const vnode = vNode(item);
          if (vnode && vnode.data && vnode.data.on) {
            delete vnode.data.on.click;
          }
        });
      }

      // 标记一下时间和来源
      const headInfo = nodeStruct.querySelector('x-feed-head-info');
      addClass(headInfo, 'yawf-feed-head-info');
    });

    vueSetup.transformComponentsRenderByTagName('feed-head-info', function (nodeStruct, Nodes) {
      const { h, insertBefore, removeChild, addClass } = Nodes;

      // 来源用个 span 套起来
      const sourceBox = nodeStruct.querySelector('x-woo-box-item x-woo-box');
      const [source, edited] = sourceBox.childNodes;
      if (source && source.nodeType !== Node.COMMENT_NODE) {
        const newSourceVNode = h('div', {
          class: [this.$style.source, 'yawf-feed-source'],
        }, ['来自 ', h('span', {
          attrs: { draggable: 'true' },
        }, [this.source || '微博 weibo.com'])]);
        insertBefore(sourceBox, newSourceVNode, source);
        removeChild(sourceBox, source);
      }

      if (edited && edited.nodeType !== Node.COMMENT_NODE) {
        addClass(edited, 'yawf-feed-edited');
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-content', function (nodeStruct, Nodes) {
      const { vNode, addClass } = Nodes;
      const headInfo = nodeStruct.querySelector('x-feed-head-info');
      if (headInfo) {
        addClass(headInfo, 'yawf-feed-head-info yawf-feed-head-info-retweet');
        const headInfoVNode = vNode(headInfo);
        if (headInfoVNode.componentOptions.propsData) {
          headInfoVNode.componentOptions.propsData.source = this.data.source;
        }
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-detail', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode, addClass } = Nodes;
      const [author, content] = nodeStruct.childNodes;

      // 原作者也是链接
      if (author && author.nodeType !== Node.COMMENT_NODE) {
        const span = author.querySelector('span');
        const userLinkVNode = h('a', {
          class: 'yawf-feed-original yawf-extra-link',
          attrs: { href: absoluteUrl(this.user.profile_url) },
        });
        const userNode = wrapNode(span, userLinkVNode);
        configClickHandler(vNode(span));
        addClass(userNode.parentNode, 'yawf-feed-original-line');
      }

      // 内容
      if (content && content.nodeType !== Node.COMMENT_NODE) {
        addClass(content, 'yawf-feed-content');
        if (this.repost) {
          addClass(content, 'yawf-feed-content-retweet');
        }
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-picture', function (nodeStruct, Nodes) {
      const { addClass, vNode } = Nodes;
      addClass(nodeStruct, 'yawf-feed-picture');
      if (this.inlineNum === 3) {
        addClass(nodeStruct, 'yawf-feed-picture-col3');
      } else if (this.inlineNum === 4) {
        addClass(nodeStruct, 'yawf-feed-picture-col4');
      }
      if (this.isSinglePic) {
        addClass(nodeStruct, 'yawf-feed-picture-single');
        if (configs.smallImage) {
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
      addClass(nodeStruct, 'yawf-feed-video');
      if (this.isPlaying) {
        addClass(nodeStruct, 'yawf-feed-video-actived');
      } else {
        addClass(nodeStruct, 'yawf-feed-video-inactive');
      }
    });

    vueSetup.transformComponentsRenderByTagName('feed-card-link', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;
      addClass(nodeStruct, 'yawf-feed-card');
      const [picture, content] = nodeStruct.childNodes;
      addClass(picture, 'yawf-feed-card-picture');
      addClass(content, 'yawf-feed-card-content');
    });

    vueSetup.transformComponentsRenderByTagName('feed-toolbar', function (nodeStruct, Nodes) {
      const { addClass } = Nodes;

      const buttons = [...nodeStruct.querySelectorAll('x-woo-box-item')];
      if (buttons.length === 3) {
        const [retweet, comment, like] = buttons;
        addClass(retweet, 'yawf-toolbar-retweet');
        addClass(comment, 'yawf-toolbar-comment');
        addClass(like, 'yawf-toolbar-like');
      }
    });

    const repostCommentListRanderTransform = function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode } = Nodes;

      const more = nodeStruct.querySelector('x-woo-divider + x-woo-box');
      if (more) {
        const linkVNode = h('a', {
          class: 'yawf-feed-comment-more yawf-extra-link',
          attrs: { href: absoluteUrl(`/${this.data.user.id}/${this.data.mblogid}#${this.curTab}`) },
        });
        const userNode = wrapNode(more, linkVNode);
        configClickHandler(vNode(more));
      }
    };
    vueSetup.transformComponentsRenderByTagName('repost-comment-feed', repostCommentListRanderTransform);
    vueSetup.transformComponentsRenderByTagName('repost-comment-list', repostCommentListRanderTransform);

    vueSetup.transformComponentsRenderByTagName('main-composer', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode } = Nodes;

      const avatar = nodeStruct.querySelector('x-woo-avatar');
      if (avatar) {
        const linkVNode = h('a', {
          class: 'yawf-feed-composer-avatar yawf-extra-link',
          attrs: { href: absoluteUrl(this.config.user.profile_url) },
        });
        const userNode = wrapNode(avatar, linkVNode);
        configClickHandler(vNode(avatar));
      }
    });

    vueSetup.transformComponentsRenderByTagName('comment', function (nodeStruct, Nodes) {
      const { h, wrapNode, vNode, addClass } = Nodes;

      const setHref = function (node, url) {
        const vnode = vNode(node);
        if (!vnode.data) vnode.data = {};
        if (!vnode.data.attrs) vnode.data.attrs = {};
        vnode.data.attrs.href = url;
      };

      const [author, ...comments] = nodeStruct.querySelectorAll('a');
      if (author) {
        setHref(author, absoluteUrl(this.item.user.profile_url));
        configClickHandler(vNode(author));
      }
      if (comments && comments.length) {
        comments.forEach((comment, index) => {
          if (!this.item.comments || !this.item.comments[index]) return;
          const item = this.item.comments[index];
          setHref(comment, absoluteUrl(item.user.profile_url));
          configClickHandler(vNode(comment));
        });
      }

      const avatar = nodeStruct.querySelector('x-woo-avatar');
      if (avatar) {
        const vnode = vNode(avatar);
        const linkVNode = h('a', {
          class: 'yawf-feed-comment-avatar yawf-extra-link',
          attrs: { href: absoluteUrl(this.item.user.profile_url) },
        });
        const userNode = wrapNode(avatar, linkVNode);
        configClickHandler(vNode(avatar));
      }

      const content = nodeStruct.querySelector('span');
      addClass(content, 'yawf-feed-comment-content');
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

      configs.smallImage = yawf.rules.feeds.layout.smallImage.getConfig();

      util.inject(renderModify, util.inject.rootKey, configs);

      css.append(`
.yawf-extra-link { display: contents; }
`);

    },
  });

}());