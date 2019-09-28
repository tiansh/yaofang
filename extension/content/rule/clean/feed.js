; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const observer = yawf.observer;

  const i18n = util.i18n;
  const css = util.css;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanFeedGroupTitle: { cn: '隐藏模块 - 微博内', tw: '隱藏模組 - 微博內', en: 'Hide modules - Weibo' },
    cleanFeedRecommend: { cn: '精彩微博推荐', tw: '精彩微博推薦', en: 'Feed you may interested in' },
    cleanFeedOuterTip: { cn: '消息流提示横幅 {{i}}', tw: '消息流提示橫幅 {{i}}', en: 'Tips for feed {{i}}' },
    cleanFeedOuterTipDetail: {
      cn: '消息流内部的提示横幅，如“ 系统提示：根据你的屏蔽设置，系统已过滤掉部分微博。”等内容。',
    },
    cleanFeedCommentTip: { cn: '评论框提示横幅 {{i}}', tw: '評論框提示橫幅 {{i}}', en: 'Tips for comment {{i}}' },
    cleanFeedCommentTipDetail: {
      cn: '经常出现在评论框上方的横幅，通常包含如“微博社区管理中心举报处理大厅，欢迎查阅！”等内容。',
    },
    cleanFeedGroupTip: { cn: '顶部分组或好友圈提醒', tw: '頂部分組或好友圈提醒', en: 'Tips for Feed for groups or friends' },
    cleanFeedVIPBackground: { cn: '自定义卡片背景', tw: '自訂卡片背景', en: 'Customized Card Background' },
    cleanFeedLastPic: { cn: '图片列表封底', tw: '圖片清單封底', en: 'Back cover of picture list' },
    cleanFeedPicTag: { cn: '图片标签', tw: '圖片標籤', en: 'Tags for picture' },
    cleanFeedSonTitle: { cn: '同源转发合并提示', tw: '同源转发合并提示', en: 'Merged forwards' },
    cleanFeedCard: { cn: '微博卡片 {{i}}', tw: '微博卡片 {{i}}', en: 'Feed Cards {{i}}' },
    cleanFeedCardDetail: {
      cn: '微博内对分享内容的摘要描述，如话题卡片、长微博卡片、分享内容卡片等。',
    },
    cleanFeedArticlePay: { cn: '微博打赏', tw: '微博打赏', en: 'Feed Acticle Pay' },
    cleanFeedTag: { cn: '微博标签', tw: '微博標籤', en: 'Tags for Feed' },
    cleanFeedRelatedLink: { cn: '相关微博链接 {{i}}', tw: '相關微博連結 {{i}}', en: 'Related feeds Link {{i}}' },
    cleanFeedRelatedLinkDetail: { cn: '位于微博底部的根据微博正文内容的关键字自动生成的话题、电影等的链接。' },
    cleanFeedSource: { cn: '来源', tw: '來源', en: 'Source' },
    cleanFeedSourceDetail: {
      cn: '建议您保留消息来源以方便按照消息来源过滤微博。隐藏消息来源不会影响对应过滤规则的工作。',
    },
    cleanFeedPop: { cn: '阅读数和推广', tw: '閱讀數和推廣', en: 'Reading Count &amp; Promote' },
    cleanFeedLike: { cn: '赞 - 微博', tw: '讚 - 微博', en: 'Like - Feed' },
    cleanFeedLikeComment: { cn: '赞 - 评论', tw: '讚 - 評論', en: 'Like - Comment' },
    cleanFeedLikeAttitude: { cn: '赞 - 表情', tw: '讚 - 表情', en: 'Like - Attitude' },
    cleanFeedForward: { cn: '转发', tw: '轉發', en: 'Forward' },
    cleanFeedFavorite: { cn: '收藏', tw: '收藏', en: 'Favorite' },
    cleanFeedPromoteOther: { cn: '帮上头条', tw: '帮上头条', en: '帮上头条' },
    cleanFeedReport: { cn: '举报', hk: '舉報', tw: '舉報/檢舉', en: 'Report' },
    cleanFeedUseCardBackground: { cn: '使用此卡片背景', tw: '使用此卡片背景', en: '使用此卡片背景' },
  });

  clean.CleanGroup('feed', () => i18n.cleanFeedGroupTitle);
  clean.CleanRule('recommend', () => i18n.cleanFeedRecommend, 1, '[node-type="recommfeed"] { display: none !important; }');
  clean.CleanRule('feed_outer_tip', () => i18n.cleanFeedOuterTip, 1, {
    acss: '.WB_feed > .W_tips { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'ask', template: () => i18n.cleanFeedOuterTip } },
  });
  clean.CleanRule('feed_tip', () => i18n.cleanFeedCommentTip, 1, {
    acss: '[node-type="feed_privateset_tip"] { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'ask', template: () => i18n.cleanFeedCommentTipDetail } },
  });
  clean.CleanRule('group_tip', () => i18n.cleanFeedGroupTip, 1, '.WB_feed_type .WB_cardtitle_b { display: none !important; }');
  clean.CleanRule('vip_background', () => i18n.cleanFeedVIPBackground, 1, `
.WB_feed_detail[style*="feed_cover/star_"],
.WB_feed_detail[style*="feed_cover/vip_"] { background: none !important; }
.WB_vipcover, .WB_starcover { display: none !important; }
.WB_feed_vipcover .WB_feed_detail { padding-top: 10px; }
.WB_feed.WB_feed_v3 .WB_feed_vipcover .WB_feed_detail { padding-top: 20px; }
`);
  clean.CleanRule('last_pic', () => i18n.cleanFeedLastPic, 1, function () {
    observer.dom.add(function hideLastPic() {
      const last = document.querySelector('.WB_feed_type .WB_expand_media .WB_media_view:not([yawf-piclast]) .pic_choose_box li:last-child a.current');
      if (last) last.closest('.WB_media_view').setAttribute('yawf-piclast', 'yawf-piclast');
      const notLast = document.querySelector('.WB_feed_type .WB_expand_media .WB_media_view[yawf-piclast] .pic_choose_box li:not(:last-child) a.current');
      if (notLast) notLast.closest('.WB_media_view').removeAttribute('yawf-piclast');
      const close = document.querySelector('.WB_feed_type .WB_expand_media .WB_media_view .artwork_box .ficon_close ');
      if (close) close.click();
    });
    css.append('.WB_feed_type .WB_expand_media .WB_media_view[yawf-piclast] .rightcursor { cursor: url("//img.t.sinajs.cn/t6/style/images/common/small.cur"), auto !important; }');
  });
  clean.CleanRule('pic_tag', () => i18n.cleanFeedPicTag, 1, '.WB_media_view .media_show_box .artwork_box .tag_showpicL, .WB_media_view .media_show_box .artwork_box .tag_showpicR, .icon_taged_pic { display: none !important; }');
  clean.CleanRule('son_title', () => i18n.cleanFeedSonTitle, 1, '.WB_feed_type .WB_feed_together .wft_hd { display: none !important; }');
  clean.CleanRule('card', () => i18n.cleanFeedCard, 1, {
    acss: '.WB_pic_app, .WB_feed_spec, .WB_music { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'ask', template: () => i18n.cleanFeedCardDetail } },
  });
  clean.CleanRule('article_pay', () => i18n.cleanFeedArticlePay, 1, function () {
    observer.dom.add(function hideArticlePay() {
      const element1 = document.querySelector('.feed_app_btn_a a[action-data*="px.e.weibo.com"]');
      if (element1) element1.closest('.feed_app_btn_a').remove();
      const element2 = document.querySelector('.WB_cardwrap #pl_article_articlePay');
      if (element2) element2.closest('.WB_cardwrap').remove();
      const element3 = document.querySelector('.rewardcomponent a[action-type="buyWrap"][action-data*="type=reward"]');
      if (element3) element3.closest('.rewardcomponent').closest(':not(:only-child)').remove();
    });
  });
  clean.CleanRule('tag', () => i18n.cleanFeedTag, 1, '.WB_tag { display: none !important; }');
  clean.CleanRule('related_link', () => i18n.cleanFeedRelatedLink, 1, {
    acss: '.WB_feed_type .WB_tag_rec { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'ask', template: () => i18n.cleanFeedRelatedLinkDetail } },
  });
  clean.CleanRule('source', () => i18n.cleanFeedSource, 1, {
    acss: `
.WB_feed_detail .WB_from { height: 26px; overflow: hidden; }
.WB_feed_detail .WB_feed_expand .WB_from { height: 16px; }
.WB_feed_detail .WB_from::before { content: " "; display: block; float: left; width: 100%; height: 30px; }
.WB_feed_detail .WB_from a[date],
.WB_feed_detail .WB_from a[yawf-date],
.WB_feed_detail .WB_from span[title],
.WB_feed_detail .WB_from .yawf-edited { float: left; position: relative; top: -30px; }
.WB_feed_detail .WB_from a[date]::after,
.WB_feed_detail .WB_from a[yawf-date]::after { content: " "; }
`,
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanFeedSourceDetail } },
  });
  clean.CleanRule('pop', () => i18n.cleanFeedPop, 1, `
.WB_feed_datail a[action-type="fl_pop"], .WB_feed_datail a[action-type="fl_pop"]+.S_txt3, 
.WB_handle li[yawf-handle-type="fl_pop"] { display: none !important; }`);
  clean.CleanRule('like', () => i18n.cleanFeedLike, 1, `
a[action-type="feed_list_like"],
a[action-type="feed_list_like"]+.S_txt3, 
[node-type="multi_image_like"],
[action-type="feed_list_image_like"], 
[action-type="object_like"], [action-type="like_object"], 
.WB_feed_datail a[action-type="fl_like"],
.WB_feed_datail a[action-type="fl_like"]+.S_txt3, 
.WB_expand .WB_handle.W_fr li:nth-child(3), 
.WB_handle li[yawf-handle-type="fl_like"],
.WB_handle li[yawf-handle-type="like"] .layer_multipic_preview .pos_icon { display: none !important; }`);
  clean.CleanRule('like_comment', () => i18n.cleanFeedLikeComment, 1, '.WB_handle li[yawf-comment-handle-type="like"] { display: none !important; }');
  clean.CleanRule('like_attitude', () => i18n.cleanFeedLikeAttitude, 1, '.W_layer_attitude { display: none !important; }');
  clean.CleanRule('forward', () => i18n.cleanFeedForward, 1, `
a[action-type="feed_list_forward"], a[action-type="feed_list_forward"]+.S_txt3,
.WB_media_expand .WB_handle a.S_func4[href$="?type=repost"], .WB_media_expand .WB_handle a.S_func4[href$="?type=repost"]+.S_txt3, 
.WB_feed_datail a[action-type="fl_forward"], .WB_feed_datail a[action-type="fl_forward"]+.S_txt3, 
.WB_expand .WB_handle.W_fr li:nth-child(1), 
.WB_handle li[yawf-handle-type="fl_forward"], .WB_handle li[yawf-handle-type="tab"]:nth-child(2) 
{ display: none !important; }`);
  clean.CleanRule('favorite', () => i18n.cleanFeedFavorite, 1, `
a[action-type="feed_list_favorite"], a[action-type="feed_list_favorite"]+.S_txt3,
.WB_feed_datail a[action-type="fl_favorite"], .WB_feed_datail a[action-type="fl_favorite"]+.S_txt3, 
.WB_handle .WB_row_line li[yawf-handle-type="fl_favorite"] { display: none !important; }`);
  clean.CleanRule('promote_other', () => i18n.cleanFeedPromoteOther, 1, '.screen_box .layer_menu_list a[action-data*="promote.vip.weibo.com"] { display: none !important; }');
  clean.CleanRule('report', () => i18n.cleanFeedReport, 1, '.screen_box .layer_menu_list a[onclick*="service.account.weibo.com/reportspam"], .WB_handle ul li[yawf-comment-handle-type="report"] { display: none !important; }');
  clean.CleanRule('use_card_background', () => i18n.cleanFeedUseCardBackground, 1, '.screen_box .layer_menu_list a[action-type="fl_cardCover"] { display: none !important; }');

  observer.feed.onBefore(function (feed) {
    const lis = Array.from(feed.querySelectorAll('.WB_feed_type .WB_handle .WB_row_line li, .WB_feed_together .WB_func .WB_handle li'));
    lis.forEach(li => {
      let type = li.querySelector('a').getAttribute('action-type');
      if (!type && li.querySelector('a[suda-uatrack="key=profile_feed&value=popularize_host"]')) type = 'fl_pop';
      if (!type && li.querySelector('span[title*="评论"], span[title*="評論"], span[title*="comment"]')) type = 'fl_comment'; // 由于用户设置，无法进行评论
      li.setAttribute('yawf-handle-type', type);
    });
    const fwli = Array.from(feed.querySelectorAll('.WB_feed_expand .WB_func .WB_handle li'));
    if (fwli.length === 3) fwli.forEach(function (li, index) {
      li.setAttribute('yawf-handle-type', ['fl_forward', 'fl_comment', 'fl_like'][index]);
    }); else if (fwli.length === 4) fwli.forEach(function (li, index) {
      li.setAttribute('yawf-handle-type', ['fl_read', 'fl_forward', 'fl_comment', 'fl_like'][index]);
    });
  });

  // 标记微博评论按钮
  observer.dom.add(function markCommentButton() {
    const cli = Array.from(document.querySelectorAll([
      '.list_ul[node-type="feed_list_commentList"] .WB_handle ul li:not([yawf-comment-handle-type])',
      '.list_ul[node-type="comment_list"] .WB_handle ul li:not([yawf-comment-handle-type])',
      '.WB_feed_comment .WB_handle ul li:not([yawf-comment-handle-type])',
    ].join(',')));
    cli.forEach(li => {
      const a = li.querySelector('a');
      let type = null;
      if (a.matches('[onclick*="service.account.weibo.com/reportspam"]')) type = 'report';
      else if (a.matches('[action-type="delete"]')) type = 'delete';
      else if (a.matches('[action-type="commentDialogue"]')) type = 'conversition';
      else if (a.matches('[action-type="reply"]')) type = 'reply';
      else if (a.matches('[action-type="replycomment"]')) type = 'reply';
      else if (a.matches('[action-type="fl_like"]')) type = 'like';
      li.setAttribute('yawf-comment-handle-type', type || '');
    });
  });

  css.append(`
body .WB_handle ul { display: flex; flex-wrap: nowrap; align-items: stretch; margin-left: -4px; }
body .WB_handle ul li { flex: 1 1 auto; float: none; width: auto; }
`);

}());
