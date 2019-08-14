; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;
  const strings = util.strings;

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
.WB_feed .WB_feed_handle { height: 20px; margin-top: 20px; display: block; position: relative; }
.WB_feed.WB_feed_v3 .WB_expand { margin-bottom: 0; }
.WB_feed .WB_feed_handle .WB_handle { float: right; margin-right: 10px; height: 20px; padding: 0; position: relative; top: -20px; }
.WB_feed .WB_feed_handle .WB_row_line { border: none; overflow: hidden; }
.WB_feed .WB_feed_handle .WB_row_line::after { content: " "; display: block; margin-left: -1px; flex: 0 0 0; order: 10; }
.WB_feed .WB_feed_handle .WB_row_line li { padding: 0 11px 0 10px; height: auto; margin-right: -1px; }
.WB_feed .WB_row_line .line { display: inline; border-width: 0; position: relative; }
.WB_feed .WB_row_line .line::before { content: " "; display: block; width: 0; height: 100%; position: absolute; right: -10px; top: 0; border-right: 1px solid; border-color: inherit; }
.WB_feed_handle .WB_row_line .arrow { display: none; }
.WB_feed_repeat { margin-top: -10px; }
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
      css.append('.WB_feed.WB_feed_v3 .WB_expand_media_box { margin-bottom: 10px; }');
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
`);
    },
  });

  i18n.smallImage = {
    cn: '缩小缩略图尺寸 {{i}}||{{repost}}缩小转发原文宽度',
    tw: '縮小縮略圖尺寸 {{i}}||{{repost}}縮小轉發原文寬度',
    en: 'Decrease the size of image {{i}}||{{repost}} Decrease the width of original feeds',
  };
  i18n.smallImageDetail = {
    cn: '缩小图片尺寸仅影响图片在您的网页上的显示效果，不能降低网络数据流量用量。',
  };

  layout.smallImage = rule.Rule({
    id: 'feed_small_image',
    version: 1,
    parent: layout.layout,
    template: () => i18n.smallImage,
    ref: {
      repost: { type: 'boolean' },
      i: { type: 'bubble', icon: 'warn', template: () => i18n.smallImageDetail },
    },
    ainit() {
      css.append(`
.WB_feed.WB_feed_v3 .WB_media_a { margin: -2px 0 0 6px; width: 258px; }
.WB_feed.WB_feed_v3 .WB_media_a_mn .WB_pic { width: 80px; height: 80px; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic { width: 80px !important; height: 80px !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img { top: 40px !important; left: 40px !important; transform: translate(-50%, -50%); position: relative !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img[style*="left:0"][style*="width:110px"] { width: 100% !important; height: auto !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img[style*="top:0"][style*="height:110px"] { height: 100% !important; width: auto !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img[style*="top:0"] { top: 0 !important; transform: translateX(-50%) !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img[style*="left:0"] { left: 0 !important; transform: translateY(-50%) !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img[style*="top:0"][style*="left:0"] { left: 0 !important; top: 0 !important; transform: none !important; }
.WB_feed.WB_feed_v4 .WB_media_a_mn .WB_pic img:not([style*="top"]) { max-width; 100%; max-height: 100%; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic { max-width: 120px; max-height: 120px; min-width: 36px; height: auto !important; width: auto !important; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_pic img { max-height: 120px; max-width: 120px; width: auto !important; height: auto !important; position: static; -webkit-transform: none; transform: none; }
.WB_feed.WB_feed_v3 .WB_media_a_m1 .WB_video:not(.yawf-WB_video):not(.WB_video_h5_v2) { width: 120px; height: 80px; min-width: 36px; }
.WB_feed.WB_feed_v3 .WB_media_a_m4 { width: 172px; }
.WB_feed.WB_feed_v3 .WB_feed_repeat .WB_media_a_m1 .WB_pic::before { display: none; }
.WB_feed.WB_feed_v3 .WB_feed_repeat .WB_media_a_m1 .WB_pic img { max-width: 120px; max-height: 120px; }
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
          let videoObserver;
          const setPlayAttribute = function setPlayAttribute() {
            const playing = video.classList.contains('wbv-playing');
            if (playing) {
              container.setAttribute('yawf-video-play', '');
              if (videoObserver) videoObserver.disconnect();
              return true;
            }
            return false;
          };
          if (setPlayAttribute()) return;
          videoObserver = new MutationObserver(setPlayAttribute);
          videoObserver.observe(video, { attributes: true, attributeFilter: ['class'], childList: false, characterData: false });
        });
      });
      const repost = this.ref.repost.getConfig();
      if (repost) css.append(`
.WB_feed.WB_feed_v3 .WB_expand_media { margin: 2px 0 8px; padding: 12px 16px 16px; }
.WB_feed.WB_feed_v3 .WB_expand { margin: 0 0 10px; padding: 10px 16px 13px; }
.WB_feed.WB_feed_v3 .WB_expand .WB_func { margin: 0; }
.WB_feed.WB_feed_v3 .WB_expand_media_box { margin-left: 0; margin-right: 0; }
.WB_feed.WB_feed_v3 .WB_expand .WB_expand_media { padding: 0 0 5px; margin: 0; }
.WB_feed.WB_feed_v3 .WB_media_view { margin: 6px auto 0; }
.WB_feed.WB_feed_v3 .WB_media_view, .WB_feed.WB_feed_v3 .WB_media_view .media_show_box li { width: 440px; }
.WB_feed.WB_feed_v3 .WB_media_view .media_show_box ul { margin-left: -32px; padding-left: 32px; }
.WB_feed.WB_feed_v3 .artwork_box { width: 440px; }
.WB_feed.WB_feed_v3 .WB_media_view .media_show_box img { max-width: 440px; height: auto !important; }
.WB_feed.WB_feed_v3 .layer_view_morepic .view_pic { padding: 0 40px 20px; }
.WB_feed.WB_feed_v3 .WB_media_view .pic_choose_box .stage_box { width: 440px; }
`);
      const feedWidth = layout.increaseFeedWidth.isEnabled() ? layout.increaseFeedWidth.ref.width.getConfig() : 600;
      if (feedWidth < 650 && repost) css.append(`
.WB_h5video { margin-left: -22px; }
.WB_h5video.hv-s1, .WB_h5video.hv-s3-2, .WB_h5video.hv-s3-5 { margin-left: 0; }
.yawf-WB_video[yawf-video-play] { margin-left: -22px; }
`);
      // FIXME 八图或九图时，展开后图片列表显示不完整
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
:root { --yawf-feed-width: ${width}px; }
.B_index, .B_discover, .B_message { --yawf-left-width: 150px; --yawf-right-width: 250px; }
.B_page { --yawf-left-width: 0px; --yawf-right-width: 320px; }
.B_index[yawf-merge-left], .B_message[yawf-merge-left] { --yawf-left-width: 0px; }

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
body a.W_gotop.W_gotop { margin-left: calc(calc(var(--yawf-feed-width) + calc(var(--yawf-left-width) + var(--yawf-right-width))) / 2); }
body .WB_timeline { margin-left: calc(calc(calc(20px + var(--yawf-feed-width)) + calc(var(--yawf-left-width) + var(--yawf-right-width))) / 2); }
html .WB_artical .WB_feed_repeat .WB_feed_publish, html .WB_artical .WB_feed_repeat .repeat_list { padding: 0 20px; }
html .WB_artical .WB_feed_repeat .W_tips, html .WB_artical .WB_feed_repeat .WB_minitab { margin: 0 16px 10px; }
`);
    },
  });

  Object.assign(i18n, {
    reorderFeedButton: {
      cn: '重新排列微博控制按钮 {{i}}||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      tw: '重新排列微博控制按鈕 {{i}}||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
      en: 'Reorder buttons of feeds {{i}}||{{0}}|{{1}}|{{2}}|{{3}}|{{4}}',
    },
    reorderFeedButtonDetail: {
      cn: '此外您还可以在版面清理选项卡，或此处，勾选以隐藏“[[clean_feed_pop]]”“[[clean_feed_favorite]]”“[[clean_feed_forward]]”“[[clean_feed_like]]”。',
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
      oldValue = oldValue || item.initial;
      const that = item.refs.find(that => that !== item && that.getConfig() === newValue);
      if (that) that.setConfig(oldValue);
    });
  };

  layout.reorderFeedButton = rule.Rule({
    id: 'feed_button_order',
    version: 1,
    parent: layout.layout,
    template: () => i18n.reorderFeedButton,
    ref: Object.assign({}, reorderRefGroup([
      { value: 'pop', text: () => i18n.reorderFeedButtonPop },
      { value: 'favorite', text: () => i18n.reorderFeedButtonFavorite },
      { value: 'forward', text: () => i18n.reorderFeedButtonForward },
      { value: 'comment', text: () => i18n.reorderFeedButtonComment },
      { value: 'like', text: () => i18n.reorderFeedButtonLike },
    ]), {
      i: { type: 'bubble', icon: 'ask', template: () => i18n.reorderFeedButtonDetail },
    }),
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

  if (env.config.stkWrapSupported) {
    i18n.disableTagDialog = {
      cn: '屏蔽收藏微博时的添加标签对话框',
      tw: '阻擋收藏微博時的添加標籤對話方塊',
      en: 'Block the dialog after marking weibo favorite',
    };

    const tagDialog = 'yawf_tag_dialog_' + strings.randKey();
    yawf.stk.wrap('lib.feed.plugins.favorite.tagDialog', function (tagDialog) {
      let enable = null, trueInnerGetter = null;
      let inner = function () { };
      const initialize = function () {
        if (enable === null || trueInnerGetter === null) return;
        if (enable) inner = trueInnerGetter();
      };
      Object.defineProperty(window, tagDialog, {
        get() { return void 0; },
        set(value) { enable = value; initialize(); },
        enumerable: false,
      });
      return function (regFunc) {
        return function (stk) {
          trueInnerGetter = () => regFunc.call(this, stk);
          initialize();
          return function (...params) {
            if (!inner) return null;
            return inner.call(this, ...params);
          };
        };
      };
    }, tagDialog);

    layout.disableTagDialog = rule.Rule({
      id: 'feed_disable_tag_dialog',
      version: 1,
      parent: layout.layout,
      template: () => i18n.disableTagDialog,
      init() {
        util.inject(function (tagDialog, enableDialog) {
          window[tagDialog] = enableDialog;
        }, tagDialog, !this.isEnabled());
      },
    });
  }

  i18n.lowReadingCountWarn = {
    cn: '在自己个人主页高亮显示阅读数量|不超过{{count}}的微博',
    tw: '在自己個人主頁高亮顯示閱讀數量|不超過{{count}}的微博',
    en: 'Highlight feeds on my profile page which has | no more than {{count}} views',
  };

  layout.lowReadingCountWarn = rule.Rule({
    id: 'feed_low_reading_warn',
    version: 23,
    parent: layout.layout,
    template: () => i18n.lowReadingCountWarn,
    ref: {
      count: {
        type: 'range',
        min: 10,
        max: 1000,
        step: 10,
        initial: 100,
      },
    },
    init() {
      const rule = this;
      observer.feed.onAfter(function (/** @type {Element} */feed) {
        const container = feed.closest('[id^="Pl_Official_MyProfileFeed__"]');
        if (!container) return;
        const popText = feed.querySelector('.WB_feed_handle [action-type="fl_pop"] i');
        if (!popText) return;
        const count = Number.parseInt(popText.title.match(/\d+/)[0], 10);
        const limit = rule.ref.count.getConfig();
        if (count > limit) return;
        feed.setAttribute('yawf-low-reading', count);
      });
      css.append('.WB_feed.WB_feed .WB_cardwrap[yawf-low-reading] { box-shadow: 0 0 4px red inset; }');
    },
  });


}());
