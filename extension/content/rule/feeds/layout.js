; (async function () {

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
    id: 'feed_fold_space',
    parent: layout.layout,
    template: () => i18n.feedFoldSpace,
    acss: `
.WB_feed.WB_feed { border-radius: 3px; box-shadow: 0 0 2px rgba(0, 0, 0, 0.2); }
.WB_feed.WB_feed .WB_cardwrap { border-radius: 0; box-shadow: 0; border-top: 1px solid rgba(0, 0, 0, 0.3); margin: -1px 0 1px; }
.WB_feed .WB_feed_handle { height: 40px; display: block; position: relative; }
.WB_feed.WB_feed_v3 .WB_expand { margin-bottom: 0; }
.WB_feed .WB_feed_handle .WB_handle { float: right; margin-right: 10px; height: 20px; padding: 0; }
.WB_feed .WB_feed_handle .WB_row_line { border: none; overflow: hidden; }
.WB_feed .WB_feed_handle .WB_row_line::after { content: " "; display: block; margin-left: -1px; flex: 0 0 0; order: 10; }
.WB_feed .WB_feed_handle .WB_row_line li { padding: 0 11px 0 10px; height: auto; margin-right: -1px; }
.WB_feed .WB_row_line .line { display: inline; border-width: 0; position: relative; }
.WB_feed .WB_row_line .line::before { content: " "; display: block; width: 0; height: 100%; position: absolute; right: -10px; top: 0; border-right: 1px solid; border-color: inherit; }
`,
  });

  i18n.sourceAtBottom = {
    cn: '将微博的发布时间和来源移动到微博末尾 {{i}}',
    tw: '將微博的發布時間和來源移動到微博末尾 {{i}}',
    en: 'Move timestamp and source of Weibo to bottom {{i}}',
  };

  layout.sourceAtBottom = rule.Rule({
    id: 'source_at_bottom',
    parent: layout.layout,
    template: () => i18n.sourceAtBottom,
    ainit() {
      observer.feed.onBefore(function (feed) {
        const from = feed.querySelector('.WB_detail > .WB_info + .WB_from');
        if (!from) return;
        from.parentNode.appendChild(from);
        from.classList.add('yawf-bottom-WB_from');
      });
      const foldSpace = layout.foldSpace.getConfig();
      if (foldSpace) {
        css.append('.WB_feed_v3 .WB_from.yawf-bottom-WB_from { position: absolute; bottom: -6px; transform: translate(0, 100%); }');
      } else {
        css.append('.WB_feed_v3 .WB_from.yawf-bottom-WB_from { margin: 10px 0 7px; }');
      }
    },
  });

  i18n.nowrapAfterAuthor = {
    cn: '微博作者与内容间不拆行',
    tw: '微博作者與內容間不拆行',
    en: 'No line breaks between author and content',
  };

  layout.nowrapAfterAuthor = rule.Rule({
    id: 'nowrapAfterAuthor',
    parent: layout.layout,
    template: () => i18n.nowrapAfterAuthor,
    acss: `
.WB_info, .WB_text { display: inline; word-wrap: break-word; }
.WB_info::after { content: "："; }
.WB_text::before { content: " "; display: block; float: right; width: 14px; height: 1px; }

.WB_info + .WB_from { display: none; }
.WB_face .opt { margin: 10px 0 0 0; position: static; right: auto; top: auto; }
.WB_face .opt .W_btn_b { width: 48px; }

.WB_face { line-height: 0; }
.WB_detail { min-height: 50px; }

[id^="Pl_Core_WendaList__"] .WB_text::before { width: 68px; }
`,
  });

  i18n.smallImage = {
    cn: '缩小缩略图尺寸||{{repost}}缩小转发原文宽度',
    tw: '縮小縮略圖尺寸||{{repost}}縮小轉發原文寬度',
    en: 'Decrease the size of images||{{repost}} Decrease the width of original feeds',
  };
  i18n.smallImageDetail = {
    cn: '缩小图片尺寸仅影响图片在您的网页上的显示效果，不能降低网络数据流量用量。',
  };

  layout.smallImage = rule.Rule({
    id: 'smallImage',
    parent: layout.layout,
    template: () => i18n.smallImage,
    ref: {
      repost: { type: 'boolean' },
    },
    ainit() {
      css.append(`
.WB_feed.WB_feed_v3 .WB_media_a { margin: -2px 0 0 6px; width: 258px; }
.WB_feed.WB_feed_v3 .WB_media_a_mn .WB_pic { width: 80px; height: 80px; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic { width: 80px !important; height: 80px !important; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic { max-width: 120px; max-height: 120px; min-width: 36px; height: auto !important; width: auto !important; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic img { max-height: 120px; max-width: 120px; width: auto; height: auto; position: static; -webkit-transform: none; transform: none; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_video:not(.yawf-WB_video):not(.WB_video_h5_v2) { width: 120px; height: 80px; min-width: 36px; }
.WB_feed.WB_feed_v3 .WB_media_a_m4 { width: 172px; }
.WB_feed.WB_feed_v3 .WB_feed_spec { height: 100px; width: 316px; border: 1px solid rgba(127,127,127,0.3); box-shadow: 0 0 2px rgba(0,0,0,0.15); border-radius: 2px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_pic { height: 100px; width: 100px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_info { height: 88px; width: 202px; padding: 7px 4px 5px 10px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_b2 .WB_feed_spec_pic, .WB_feed.WB_feed_v3 .WB_feed_spec_b2 .WB_feed_spec_pic img, .WB_feed.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_pic, .WB_feed.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_pic img { height: auto; min-height: 100px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_b .WB_feed_spec_pic, .WB_feed.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_pic, .WB_feed.WB_feed_v3 .WB_feed_spec2 .WB_feed_spec_pic { height: 100px; width: 250px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_b, .WB_feed.WB_feed_v3 .WB_feed_spec_c, .WB_feed.WB_feed_v3 .WB_feed_spec2 { width: 250px; height: auto; }
.WB_feed.WB_feed_v3 .WB_feed_spec_info { float: right; height: 88px; padding: 7px 4px 5px 10px; width: 202px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_b .WB_feed_spec_info, .WB_feed.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_info, .WB_feed.WB_feed_v3 .WB_feed_spec2 .WB_feed_spec_info { float: none; height: auto; width: auto; padding: 10px 5px 0; }
.WB_feed.WB_feed_v3 .WB_feed_spec_b .WB_feed_spec_info .WB_feed_spec_cont .WB_feed_spec_tit, .WB_feed.WB_feed_v3 .WB_feed_spec_c .WB_feed_spec_info .WB_feed_spec_cont .WB_feed_spec_tit, .WB_feed.WB_feed_v3 .WB_feed_spec2 .WB_feed_spec_info .WB_feed_spec_cont .WB_feed_spec_tit { font-size: inherit; font-weight: 700; margin: 0 0 6px; }
.WB_feed.WB_feed_v3 .WB_feed_spec_info .WB_feed_spec_cont .WB_feed_spec_brieftxt { line-height: 15px; height: 30px; }

.layer_feedimgshow .WB_feed.WB_feed_v3 .WB_media_a { margin: 0; width: auto; }
.layer_feedimgshow .WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic { max-width: none; max-height: none; min-width: auto; }
.layer_feedimgshow .WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic img { max-width: 260px; max-width: 40vw; max-height: 260px; max-height: 40vh; min-width: auto; }

.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_video.WB_video_h5 { width: auto; height: auto; display: table; }
.WB_h5video.hv-s1, .WB_h5video.hv-s3-2, .WB_h5video.hv-s3-5 { width: 120px; height: 80px; max-width: 120px; max-height: 80px; min-width: 36px; }
.WB_h5video.hv-s1 .con-11, .WB_h5video.hv-s3-2 .con-11, .WB_h5video.hv-s3-5 .con-11 { display: none; }
.WB_h5video.hv-s1 video, .WB_h5video.hv-s3-2 video, .WB_h5video.hv-s3-5 video { max-width: 100%; max-height: 100%; }
.WB_h5video.hv-s3.hv-s3-2 .con-4,
.WB_h5video.hv-s3.hv-s3-5 .con-4 { opacity: 1; z-index: 1; }
.WB_h5video.hv-s3.hv-s3-2:hover .con-6,
.WB_h5video.hv-s3.hv-s3-5:hover .con-6,
.WB_h5video.hv-s3.hv-s3-5 .con-3 .box-2 em,
.WB_h5video .con-3.hv-s3-3 .box-3 { opacity: 0; z-index: 0; }

.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_video:not([yawf-video-play]) { width: 120px; height: 80px; min-width: 36px; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_video:not([yawf-video-play]) .wbv-control-bar { display: none !important; }
`);
      observer.dom.add(function smallVideo() {
        const videos = Array.from(document.querySelectorAll('.WB_video_h5_v2 .WB_h5video_v2:not([yawf-watch-pouse])'));
        videos.forEach(video => {
          video.setAttribute('yawf-watch-pause', '');
          const container = video.closest('.WB_video_h5_v2');
          const setPlayAttribute = function setPlayAttribute() {
            const playing = video.classList.contains('wbv-playing');
            if (playing) {
              container.setAttribute('yawf-video-play', '');
              videoObserver.disconnect();
            }
          };
          setPlayAttribute();
          const videoObserver = new MutationObserver(setPlayAttribute);
          videoObserver.observe(video, { attributes: true, attributeFilter: ['class'], childList: false, characterData: false });
        });
      });
      const repost = this.ref.repost.getConfig();
      if (repost) css.append(`
.WB_feed.WB_feed_v3 .WB_expand_media { margin: 2px 0 8px; padding: 12px 16px 16px; }
.WB_feed.WB_feed_v3 .WB_expand { margin: 0 0 10px; padding: 10px 16px 13px; }
.WB_feed.WB_feed_v3 .WB_expand .WB_func { margin: 0; }
.WB_feed.WB_feed_v3 .WB_expand_media_box { margin: 0;  }
.WB_feed.WB_feed_v3 .WB_expand .WB_expand_media { padding: 0 0 5px; margin: 0; }
.WB_feed.WB_feed_v3 .WB_media_view { margin: 6px auto 0; }
.WB_feed.WB_feed_v3 .WB_media_view, .WB_feed.WB_feed_v3 .WB_media_view .media_show_box li { width: 440px; }
.WB_feed.WB_feed_v3 .WB_media_view .media_show_box ul { margin-left: -32px; padding-left: 32px; }
.WB_feed.WB_feed_v3 .artwork_box { width: 440px; }
.WB_feed.WB_feed_v3 .WB_media_view .media_show_box img { max-width: 440px; height: auto !important; }
.WB_feed.WB_feed_v3 .layer_view_morepic .view_pic { padding: 0 40px 20px; }
.WB_feed.WB_feed_v3 .WB_media_view .pic_choose_box .stage_box { width: 440px; }
`);
      /*
      if (
        !filter.items.style.layout.width_weibo.conf ||
        filter.items.style.layout.width_weibo.ref.width.conf < 650 &&
        this.ref.repost.conf
      ) css.append(`
.WB_h5video { margin-left: -22px; }
.WB_h5video.hv-s1, .WB_h5video.hv-s3-2, .WB_h5video.hv-s3-5 { margin-left: 0; }
`);
*/
      // FIXME 八图或九图时，展开后图片列表显示不完整
    },
  });

  Object.assign(i18n, {
    reorderFeedButton: {
      cn: '重新排列微博控制按钮||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      tw: '重新排列微博控制按鈕||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      en: 'Reorder buttons of feeds||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
    },
    reorderFeedButtonPop: { cn: '推广', tw: '推廣', en: ' Promote' },
    reorderFeedButtonFavorite: { cn: '收藏', tw: '收藏', en: 'Favourite' },
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
      const that = item.refs.find(that => that !== item && that.getConfig() === newValue);
      if (that) that.setConfig(oldValue);
    });
  };

  layout.reorderFeedButton = rule.Rule({
    id: 'reorderFeedButton',
    parent: layout.layout,
    template: () => i18n.reorderFeedButton,
    ref: Object.assign({}, reorderRefGroup([
      { value: 'pop', text: () => i18n.reorderFeedButtonPop },
      { value: 'favorite', text: () => i18n.reorderFeedButtonFavorite },
      { value: 'forward', text: () => i18n.reorderFeedButtonForward },
      { value: 'comment', text: () => i18n.reorderFeedButtonComment },
      { value: 'like', text: () => i18n.reorderFeedButtonLike },
    ])),
    init() {
      [0, 1, 2, 3, 4].forEach(key => {
        keepOrderItemsDiff(this.ref[key]);
      });
    },
    ainit() {
      css.append(`
.WB_feed.WB_feed_v3 .WB_func .WB_handle li:last-child .line { border-right-width: 1px; }
.WB_feed.WB_feed_v3 .WB_func .WB_handle ul { overflow: hidden; }
.WB_feed.WB_feed_v3 .WB_func .WB_handle ul::after {  content: " "; display: block; margin-left: -1px; flex: 0 0 0; order: 10; }
.WB_handle ul li[yawf-handle-type="fl_read"] { order: 0; }
${[0, 1, 2, 3, 4].map(index => `
.WB_handle ul li[yawf-handle-type="fl_${this.ref[index].getConfig()}"] { order: ${index + 1}; }
`).join('')}
    `);
    },
  });

  Object.assign(i18n, {
    reorderCommentButton: {
      cn: '重新排列评论控制按钮||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      tw: '重新排列評論微博控制按鈕||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      en: 'Reorder buttons of comments||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
    },
    reorderCommentButtonReport: { cn: '举报', hk: '舉報', tw: '檢舉', en: 'Report' },
    reorderCommentButtonDelete: { cn: '删除', tw: '刪除', en: 'Delete' },
    reorderCommentButtonConversition: { cn: '查看对话', tw: '查看對話', en: 'View Conversation' },
    reorderCommentButtonReply: { cn: '回复', tw: '回覆', en: 'Reply' },
    reorderCommentButtonLike: { cn: '赞', tw: '讚', en: 'Like' },
  });

  layout.reorderCommentButton = rule.Rule({
    id: 'reorderCommentButton',
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
