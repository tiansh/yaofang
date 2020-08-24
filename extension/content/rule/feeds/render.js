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
      util.inject(function (rootKey, Nodes) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        const muteOnClick = function (vnode) {
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
            attrs: { href: this.userInfo.profile_url },
          });
          const avatarNode = wrapNode(avatar, userAvatarLinkVNode);
          muteOnClick(vNode(avatar));

          // 用户昵称更得是链接
          const userSpan = nodeStruct.querySelector('span');
          const userLinkVNode = h('a', {
            class: 'yawf-feed-author yawf-extra-link',
            attrs: { href: this.userInfo.profile_url },
          });
          const userNode = wrapNode(userSpan, userLinkVNode);
          muteOnClick(vNode(userSpan));
          addClass(userNode.parentNode, 'yawf-feed-author-line');

          // 快转的作者也是链接形式
          if (this.screen_name_suffix_new) do {
            const index = this.screen_name_suffix_new.findIndex(item => item.type === 2);
            const item = this.screen_name_suffix_new[index];
            const span = userNode.parentNode.children[index];
            const feed = vueSetup.closest(this, 'feed');
            if (!index || !span || !feed) break;
            const fauthorId = feed.data.ori_uid;
            const linkVNode = h('a', {
              class: 'yawf-feed-fast-author yawf-extra-link',
              attrs: { href: `/u/${fauthorId}` },
            });
            wrapNode(span, linkVNode);
            muteOnClick(vNode(span));
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
              attrs: { href: this.user.profile_url },
            });
            const userNode = wrapNode(span, userLinkVNode);
            muteOnClick(vNode(span));
            addClass(userNode.parentNode, 'yawf-feed-original-line');
          }

          // 内容
          if (content && content.nodeType !== Node.COMMENT_NODE) {
            addClass(content, 'yawf-feed-content');
          }
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

      }, util.inject.rootKey);

      css.append(`
.yawf-extra-link { display: contents; }
`);

    },
  });

}());