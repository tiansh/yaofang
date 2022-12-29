; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;

  const layout = feeds.layout = {};

  i18n.feedLayoutGroupTitle = {
    cn: '微博布局',
    tw: '微博佈局',
    en: 'Feed Layout',
  };

  layout.layout = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedLayoutGroupTitle,
  });

  i18n.feedFoldSpace = {
    cn: '去除微博卡片之间的空隙',
    tw: '去除微博卡片之間的空隙',
    en: 'Remove gaps between feeds',
  };

  layout.foldSpace = rule.Rule({
    id: 'feed_no_space',
    version: 1,
    parent: layout.layout,
    template: () => i18n.feedFoldSpace,
    acss: `
.WB_feed.WB_feed { border-radius: 3px; box-shadow: 0 0 2px rgba(0, 0, 0, 0.2); }
.WB_feed.WB_feed .WB_cardwrap { border-radius: 0; box-shadow: none; border-top: 1px solid rgba(0, 0, 0, 0.3); margin: -1px 0 1px; }
.WB_feed .WB_detail { margin-bottom: 40px; }
.WB_feed .WB_feed_handle { height: 20px; margin-top: -20px; display: block; position: relative; }
.WB_feed .WB_feed_expand { margin-top: 5px; }
.WB_feed.WB_feed_v3 .WB_expand { margin-bottom: 0; }
.WB_feed .WB_feed_handle .WB_handle { float: right; margin-right: 10px; height: 20px; padding: 0; position: relative; top: -20px; }
.WB_feed .WB_feed_handle .WB_row_line { border: none; overflow: hidden; line-height: 26px; }
.WB_feed .WB_feed_handle .WB_row_line::after { content: " "; display: block; margin-left: -1px; flex: 0 0 0; order: 10; }
.WB_feed .WB_feed_handle .WB_row_line li { padding: 0 11px 0 10px; height: auto; margin-right: -1px; }
.WB_feed .WB_row_line .line { display: inline; border-width: 0; position: relative; }
.WB_feed .WB_row_line .line::before { content: " "; display: block; width: 0; height: 100%; position: absolute; right: -10px; top: 0; border-right: 1px solid; border-color: inherit; }
.WB_feed .WB_row_line .line span .W_ficon { vertical-align: middle; }
.WB_feed_handle .WB_row_line .arrow { display: none; }
.WB_feed_repeat { margin-top: -10px; }
.WB_feed_comment.WB_feed_comment .WB_feed_detail { position: relative; padding-bottom: 4px; }
.WB_feed_comment.WB_feed_comment .WB_feed_detail::after { display: none; }
.WB_feed_v3 .WB_expand .WB_empty .WB_innerwrap, .WB_feed_comment .WB_expand { margin-bottom: 0; }
`,
  });

  i18n.sourceAtBottom = {
    cn: '将微博的发布时间和来源移动到微博末尾',
    tw: '將微博的發布時間和來源移動到微博末尾',
    en: 'Move timestamp and source of Weibo to bottom',
  };

  layout.sourceAtBottom = rule.Rule({
    id: 'feed_source_at_bottom',
    version: 1,
    parent: layout.layout,
    template: () => i18n.sourceAtBottom,
    ainit() {
      observer.dom.add(function () {
        const fromList = Array.from(document.querySelectorAll('.WB_detail > .WB_info + .WB_from'));
        if (!fromList.length) return;
        fromList.forEach(from => {
          from.parentNode.appendChild(from);
          from.classList.add('yawf-bottom-WB_from');
        });
      });
      const foldSpace = layout.foldSpace.getConfig();
      if (foldSpace) {
        css.append(`
.WB_from.WB_from.yawf-bottom-WB_from { position: absolute; bottom: 40px; margin: 0; transform: translate(0, 100%); line-height: 28px; }
`);
      } else {
        css.append('.WB_from.WB_from.yawf-bottom-WB_from { margin: 10px 0 7px; }');
      }
      css.append('.WB_feed.WB_feed .WB_expand_media_box { margin-bottom: 10px; }');
    },
  });

  Object.assign(i18n, {
    nowrapAfterAuthor: {
      cn: '微博作者与内容间不拆行 {{i}}',
      tw: '微博作者與內容間不拆行 {{i}}',
      en: 'No line breaks between author and content {{i}}',
    },
    nowrapAfterAuthorDetail: {
      cn: '如果您启用本功能时未选择“[[feed_source_at_bottom]]”，微博的来源将会被隐藏。',
    },
  });

  layout.nowrapAfterAuthor = rule.Rule({
    id: 'feed_author_content_nowrap',
    version: 1,
    parent: layout.layout,
    template: () => i18n.nowrapAfterAuthor,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.nowrapAfterAuthorDetail },
    },
    ainit() {
      css.append(`
.WB_info, .WB_text { display: inline; word-wrap: break-word; }
.WB_info::after { content: "："; }
.WB_text::before { content: " "; display: block; float: right; width: 14px; height: 1px; }
.WB_expand .WB_text::before { width: 0; }
[yawf-hide-box] .WB_text::before { width: 37px; }
[yawf-hide-box] .WB_expand .WB_text::before { width: 14px; }

.WB_info + .WB_from { display: none; }
body .WB_feed_v3 .WB_face .opt.opt { margin: 10px 0 0 0; position: static; right: auto; top: auto; }
body .WB_feed_v3 .WB_face .opt.opt .W_btn_b { width: 48px; }

.WB_face { line-height: 0; }
.WB_detail { min-height: 50px; }

[id^="Pl_Core_WendaList__"] .WB_text::before { width: 68px; }

.WB_feed.WB_feed_v3 .WB_expand_media_box { margin-top: 10px; }

.WB_feed.WB_feed_v3 .WB_info .sp_kz, 
.WB_feed.WB_feed_v3 .WB_info .W_autocut { vertical-align: top; }
`);
    },
  });

  i18n.smallImage = {
    cn: '缩小缩略图尺寸 {{i}}||{{repost}}缩小转发原文宽度（仅限V6）',
    tw: '縮小縮略圖尺寸 {{i}}||{{repost}}縮小轉發原文寬度（僅限V6）',
    en: 'Decrease the size of image {{i}}||{{repost}} Decrease the width of original feeds (V6 Only)',
  };
  i18n.smallImageDetail = {
    cn: '缩小图片尺寸仅影响图片在您的网页上的显示效果，不能降低网络数据流量用量。',
  };

  layout.smallImage = rule.Rule({
    v7Support: true,
    id: 'feed_small_image',
    version: 1,
    parent: layout.layout,
    template: () => i18n.smallImage,
    ref: {
      repost: { type: 'boolean' },
      i: { type: 'bubble', icon: 'warn', template: () => i18n.smallImageDetail },
    },
    ainit() {
      // 单张图片尺寸计算在 render 里
      css.append(`
.yawf-feed-picture-col3 > div { width: 252px; }
.yawf-feed-picture-col4 > div { width: 332px; }
.yawf-feed-video { transition: width 0s 0.2s ease; }
.yawf-feed-video-inactive { width: 150px; }
.yawf-feed-card > div { width: 316px; }
.yawf-feed-card-picture { width: 80px !important; height: 80px !important; }
.yawf-feed-comment-picture { max-width: 80px; }
.yawf-feed-card-article { max-width: 240px; }
`);
      util.inject(function (rootKey) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        // 我们需要他不复用视频组件
        vueSetup.transformComponentsRenderByTagName('feed-content', function (nodeStruct, Nodes) {
          const video = nodeStruct.querySelectorAll('x-feed-video');
          if (video && !video.key) video.key = this.data.id; // 用 mid 很方便
        });
        vueSetup.eachComponentVM('feed-video', function (vm) {
          // 这个变量要存下来，不然到 beforeDestroy 的时候他爹就不是现在这个了
          const feed = vm.$parent.data;
          if (!vm.isPlaying && feed._yawf_VideoTouched) {
            vm.isPlaying = true;
            vm.$forceUpdate();
          }
          vm.$on('hook:beforeDestroy', function () {
            feed._yawf_VideoTouched = vm.isPlaying;
          });
          vueSetup.transformComponentRender(vm, function (nodeStruct, Nodes) {
            const { addClass } = Nodes;
            if (this.isPlaying) {
              addClass(nodeStruct, 'yawf-feed-video-actived');
            } else {
              addClass(nodeStruct, 'yawf-feed-video-inactive');
            }
          });
        });

      }, util.inject.rootKey);
    },
  });

  Object.assign(i18n, {
    increaseFeedWidth: {
      cn: '加宽微博宽度|为{{width}}像素',
      tw: '加寬微博寬度|為{{width}}像素',
      en: 'Increase width of feeds | to {{width}}px',
    },
  });

  layout.increaseFeedWidth = rule.Rule({
    id: 'feed_increase_width',
    version: 1,
    parent: layout.layout,
    template: () => i18n.increaseFeedWidth,
    ref: {
      width: {
        type: 'range',
        min: 600,
        initial: 750,
        max: 1280,
        step: 10,
      },
    },
    init() {
      const width = this.isEnabled() ? this.ref.width.getConfig() : 600;
      css.append(`
:root { --yawf-feed-width: ${width}px; --yawf-extra-padding: 0px; }
.B_index, .B_discover, .B_message { --yawf-left-width: 150px; --yawf-right-width: 250px; }
.B_page { --yawf-left-width: 0px; --yawf-right-width: 320px; }
.B_index[yawf-merge-left], .B_message[yawf-merge-left] { --yawf-left-width: 0px; --yawf-extra-padding: 10px; }
.B_artical { --yawf-feed-width: 1000px; --yawf-left-width: 0px; --yawf-right-width: 0px; }

html .B_index .WB_frame,
html .B_message .WB_frame,
html .B_discover .WB_frame,
html .B_page .WB_frame,
html .B_page .WB_frame_a {
  width: calc(var(--yawf-feed-width) + calc(var(--yawf-left-width) + var(--yawf-right-width))) !important;
}
html .B_index .WB_frame #plc_main,
html .B_message .WB_frame #plc_main,
html .B_discover .WB_frame #plc_main,
html .B_page .WB_frame #plc_main {
  width: calc(var(--yawf-feed-width) + var(--yawf-right-width)) !important;
}
html .B_index .WB_main_c,
html .B_message .WB_main_c,
html .B_page .WB_frame_c,
html .B_discover .WB_frame_c {
  width: var(--yawf-feed-width) !important;
}
html .B_page .WB_frame_c {
  margin-right: 0;
}

html .WB_frame_c ~ .WB_frame_b {
  margin-left: 20px;
  margin-right: 0;
}

@media screen and (max-width: 1006px) {
.B_index, .B_message { --yawf-right-width: 10px; }
}
@media screen and (max-width: 939px) {
.B_page { --yawf-right-width: 0px; }
}

body .WB_tab_a .tab_box { display: flex; }
body .WB_tab_a .tab_box > * { flex: 0 0 auto; }
body .WB_tab_a .tab_box > .W_fr { order: 2; }
body .WB_tab_a .tab_box::after { order: 1; flex: 1 0 0; height: auto; }
body .WB_tab_a .tab_box_a .fr_box { flex: 1 0 0; }
body .WB_tab_a .tab_box_a::after { content: none; }
body .WB_feed_v3 .WB_face .opt { right: calc(132px - var(--yawf-feed-width)); }
body a.W_gotop.W_gotop { margin-left: calc(calc(calc(var(--yawf-feed-width) + var(--yawf-extra-padding)) + calc(var(--yawf-left-width) + var(--yawf-right-width))) / 2); }
body .WB_timeline { margin-left: calc(calc(calc(20px + var(--yawf-feed-width)) + calc(var(--yawf-left-width) + var(--yawf-right-width))) / 2); }
html .WB_artical .WB_feed_repeat .WB_feed_publish, html .WB_artical .WB_feed_repeat .repeat_list { padding: 0 20px; }
html .WB_artical .WB_feed_repeat .W_tips, html .WB_artical .WB_feed_repeat .WB_minitab { margin: 0 16px 10px; }
`);
    },
  });

  Object.assign(i18n, {
    reorderFeedButton: {
      cn: '重新排列微博控制按钮 {{i}}||{{0}}|{{1}}|{{2}}',
      tw: '重新排列微博控制按鈕 {{i}}||{{0}}|{{1}}|{{2}}',
      en: 'Reorder buttons of feeds {{i}}||{{0}}|{{1}}|{{2}}',
    },
    reorderFeedButtonDetail: {
      cn: '此外您还可以在版面清理选项卡，或此处，勾选以隐藏“[[clean_feed_forward]]”“[[clean_feed_like]]”。',
    },
    reorderFeedButtonForward: { cn: '转发', tw: '轉發', en: 'Forward' },
    reorderFeedButtonComment: { cn: '评论', tw: '評論', en: 'Comment' },
    reorderFeedButtonLike: { cn: '赞', tw: '讚', en: 'Like' },
  });

  const reorderRefGroup = select => {
    const refs = [];
    refs.splice(0, 0, ...select.map(button => ({
      type: 'select',
      initial: button.value,
      select,
      refs,
    })));
    return Object.assign({}, ...refs.map((ref, index) => ({ [index]: ref })));
  };

  const keepOrderItemsDiff = item => {
    item.addConfigListener((newValue, oldValue) => {
      oldValue = oldValue || item.initial;
      const that = item.refs.find(that => that !== item && that.getConfig() === newValue);
      if (that) that.setConfig(oldValue);
    });
  };

  layout.reorderFeedButton = rule.Rule({
    v7Support: true,
    id: 'feed_buttons_order', // 悄悄换个名字，因为之前那个设置没法继承下来
    version: 1,
    parent: layout.layout,
    template: () => i18n.reorderFeedButton,
    ref: Object.assign({}, reorderRefGroup([
      { value: 'forward', text: () => i18n.reorderFeedButtonForward },
      { value: 'comment', text: () => i18n.reorderFeedButtonComment },
      { value: 'like', text: () => i18n.reorderFeedButtonLike },
    ]), {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.reorderFeedButtonDetail },
    }),
    init() {
      [0, 1, 2].forEach(key => {
        keepOrderItemsDiff(this.ref[key]);
      });
    },
    ainit() {
      [0, 1, 2].forEach(index => {
        const config = this.ref[index].getConfig();
        const selector = {
          forward: '.yawf-feed-toolbar-retweet',
          comment: '.yawf-feed-toolbar-comment',
          like: '.yawf-feed-toolbar-like',
        }[config];
        css.append(`${selector} { order: ${index} }`);
      });
    },
  });

  Object.assign(i18n, {
    reorderCommentButton: {
      cn: '重新排列评论控制按钮||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      tw: '重新排列評論微博控制按鈕||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      en: 'Reorder buttons of comments||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
    },
    reorderCommentButtonDetail: {
      cn: '此外您还可以在版面清理选项卡，或此处，勾选以隐藏“[[clean_feed_like_comment]]”。',
    },
    reorderCommentButtonReport: { cn: '举报', hk: '舉報', tw: '檢舉', en: 'Report' },
    reorderCommentButtonDelete: { cn: '删除', tw: '刪除', en: 'Delete' },
    reorderCommentButtonConversition: { cn: '查看对话', tw: '查看對話', en: 'View Conversation' },
    reorderCommentButtonReply: { cn: '回复', tw: '回覆', en: 'Reply' },
    reorderCommentButtonLike: { cn: '赞', tw: '讚', en: 'Like' },
  });

  layout.reorderCommentButton = rule.Rule({
    id: 'feed_button_order_comment',
    version: 1,
    parent: layout.layout,
    template: () => i18n.reorderCommentButton,
    ref: Object.assign({}, reorderRefGroup([
      { value: 'report', text: () => i18n.reorderCommentButtonReport },
      { value: 'delete', text: () => i18n.reorderCommentButtonDelete },
      { value: 'conversition', text: () => i18n.reorderCommentButtonConversition },
      { value: 'reply', text: () => i18n.reorderCommentButtonReply },
      { value: 'like', text: () => i18n.reorderCommentButtonLike },
    ])),
    init() {
      [0, 1, 2, 3, 4].forEach(key => {
        keepOrderItemsDiff(this.ref[key]);
      });
    },
    ainit() {
      css.append([0, 1, 2, 3, 4].map(index => `
.WB_handle ul li[yawf-comment-handle-type="${this.ref[index].getConfig()}"] { order: ${index}; }
`).join(''));
    },
  });


}());
