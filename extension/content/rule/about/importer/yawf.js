; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const i18n = util.i18n;

  const importer = yawf.importer;

  i18n.yawfScriptSource = {
    cn: 'YAWF 用户脚本',
    tw: 'YAWF 用戶腳本',
    en: 'YAWF user script',
  };

  class Converter {
    constructor() {
      /** @type {Map<string, Array<(value: any) => Object<string, any>>>} */
      this.rules = new Map();
      this.initialize();
    }
    convert(yawf) {
      const rules = this.rules;
      /** @type Map<(values: Array<any>, target: string) => ({ [target: string]: any }), { target: string, values: Array<any> }> */
      this.pending = new Map();
      return Object.assign({}, ...Object.keys(yawf).map(key => {
        if (!rules.has(key)) return {};
        return Object.assign({}, ...rules.get(key).map(rule => rule(yawf[key])));
      }), ...[...this.pending.entries()].map(
        ([converter, { target, values }]) => converter(values, target)
      ));
    }
    rule(source, target, converter = null) {
      const that = this;
      if (!this.rules.has(source)) this.rules.set(source, []);
      const sourceRule = this.rules.get(source);
      if (typeof source === 'string' && typeof target === 'string') {
        if (typeof converter === 'function') {
          sourceRule.push(value => ({ [target]: converter(value) }));
        } else {
          sourceRule.push(value => ({ [target]: value }));
        }
      }
      if (Array.isArray(source)) {
        source.forEach((key, index) => {
          sourceRule.push(value => {
            const pending = that.pending;
            const data = pending.get(converter) || { target, values: Array(source.length) };
            data.values[index] = value;
            const fullFilled = data.values.reduce(v => v + 1) === data.values.length;
            if (!fullFilled) return;
            converter(data.values, target);
            pending.delete(converter);
          });
        });
      }
    }
    initialize() {
      const rule = this.rule.bind(this);
      // 微博过滤
      rule('weibo.tool.auto_check_following', 'filter_follow_check');
      rule('weibo.tool.auto_check_following.frequency', 'filter_follow_check.frequency', days => days * 86400e3);
      rule('weibo.tool.uncheck_follow_presenter', 'uncheck_follow_presenter');
      rule('weibo.tool.auto_unfold_ttartical', 'show_artical_without_follow');
      rule('weibo.tool.load_weibo_by_newest', 'filter_homepage_newest_feeds');
      rule('weibo.tool.load_weibo_by_group', 'filter_homepage_single_group');
      rule('weibo.tool.load_weibo_by_group.group', 'filter_homepage_single_group.group', group => `g${group.id}`);
      rule('weibo.tool.load_weibo_by_multi_group.enabled', 'filter_homepage_multi_group');
      rule(['weibo.tool.load_weibo_by_multi_group', 'weibo.tool.load_weibo_by_multi_group.whisper'], 'filter_homepage_multi_group.groups', ([groups, whisper], target) => ([
        ...(groups || []).map(group => `g${group}`),
        ...(whisper ? ['whisper'] : []),
      ]));
      rule('weibo.other.auto_load_new_weibo', 'filter_homepage_auto_load');
      rule('weibo.other.desktop_notification', 'filter_homepage_desktop_notify');
      rule('weibo.other.desktop_notification.types', 'filter_homepage_desktop_notify.whitelist');
      rule('weibo.tool.redirectWeibo', 'filter_profile_show_all');
      rule('weibo.tool.fast_block_button', 'filter_manually_hide');
      // 内容～来源
      const regexenImporter = regexen => regexen.map(source => ({ source, flags: 'mu' }));
      const userIdImporter = ids => ids.map(id => ({ id }));
      rule('weibo.filters.keyword.whitelist', 'filter_content_text_show.items');
      rule('weibo.filters.keyword.blacklist', 'filter_content_text_hide.items');
      rule('weibo.filters.keyword.foldlist', 'filter_content_text_fold.items');
      rule('weibo.filters.regexp.whitelist', 'filter_content_regex_show.items', regexenImporter);
      rule('weibo.filters.regexp.blacklist', 'filter_content_regex_hide.items', regexenImporter);
      rule('weibo.filters.regexp.foldlist', 'filter_content_regex_fold.items', regexenImporter);
      rule('weibo.filters.account.whitelist', 'filter_author_id_show.items', userIdImporter);
      rule('weibo.filters.account.blacklist', 'filter_author_id_hide.items', userIdImporter);
      rule('weibo.filters.account.foldlist', 'filter_author_id_fold.items', userIdImporter);
      rule('weibo.filters.accountf.blacklist', 'filter_author_forward_id_hide.items', userIdImporter);
      rule('weibo.filters.accountf.foldlist', 'filter_author_forward_id_fold.items', userIdImporter);
      rule('weibo.original.blacklist_d', 'filter_original_discover');
      rule('weibo.filters.original.whitelist', 'filter_original_id_show.items', userIdImporter);
      rule('weibo.filters.original.blacklist', 'filter_original_id_hide.items', userIdImporter);
      rule('weibo.filters.original.foldlist', 'filter_original_id_fold.items', userIdImporter);
      rule('weibo.original.by_follower.enabled', 'filter_original_follower');
      rule('weibo.original.by_follower.fans', 'filter_original_follower.count');
      rule('weibo.original.by_follower', 'filter_original_follower.account', userIdImporter);
      rule('weibo.filters.mention.whitelist', 'filter_mention_name_show.items');
      rule('weibo.filters.mention.blacklist', 'filter_mention_name_hide.items');
      rule('weibo.filters.mention.foldlist', 'filter_mention_name_fold.items');
      rule('weibo.filters.topic.whitelist', 'filter_topic_text_show.items');
      rule('weibo.filters.topic.blacklist', 'filter_topic_text_hide.items');
      rule('weibo.filters.topic.foldlist', 'filter_topic_text_fold.items');
      rule('weibo.filters.source.whitelist', 'filter_source_text_show.items');
      rule('weibo.filters.source.blacklist', 'filter_source_text_hide.items');
      rule('weibo.filters.source.foldlist', 'filter_source_text_fold.items');
      // 更多
      rule('weibo.other.my_weibo', 'filter_my_feed');
      rule('weibo.other.my_original', 'filter_my_original');
      rule('weibo.other.mention_me', 'filter_mention_me');
      rule('weibo.other.ad_feed', 'filter_ad_feed');
      rule('weibo.other.fans_top', 'filter_fans_top');
      rule('weibo.other.product_card', 'filter_weibo_product');
      rule('weibo.other.tb_tm_wb', 'filter_tb_tm_feed');
      rule('weibo.other.weibo_pay_gift', 'filter_weibo_pay');
      rule('weibo.other.user_like', 'filter_user_like');
      rule('weibo.other.fake_weibo', 'filter_fake_weibo');
      rule('weibo.other.deleted_forward', 'filter_deleted_forward');
      rule('weibo.other.comment_and_reply', 'filter_comment_and_forward');
      rule('weibo.other.vote_weibo', 'filter_vote');
      rule('weibo.other.red2014', 'filter_red_pack');
      rule('weibo.other.jinli_forward', 'filter_koi_forward');
      rule('weibo.other.appitem', 'filter_app_item');
      rule('weibo.other.wenda', 'filter_wenda');
      rule('weibo.other.wenwodr', 'filter_wenwo_dr');
      rule('weibo.other.yizhibo.type', 'filter_yizhibo');
      rule('weibo.other.stock', 'filter_stock');
      rule('weibo.other.paid', 'filter_paid');
      rule('weibo.other.multi_topic', 'filter_multiple_topics_feed');
      rule('weibo.other.multi_topic.num', 'filter_multiple_topics_feed.num');
      // 评论过滤
      rule('weibo.other.comment_show_all', 'comment_layout_by_time');
      rule('weibo.other.fold_child_comment', 'comment_layout_hide_sub');
      rule('weibo.filters.ckeyword.whitelist', 'filter_comment_text_show.items');
      rule('weibo.filters.ckeyword.blacklist', 'filter_comment_text_hide.items');
      rule('weibo.filters.cregexp.whitelist', 'filter_comment_regex_show.items', regexenImporter);
      rule('weibo.filters.cregexp.blacklist', 'filter_comment_regex_hide.items', regexenImporter);
      rule('weibo.filters.cuser.whitelist', 'filter_comment_name_show.items');
      rule('weibo.filters.cuser.blacklist', 'filter_comment_name_hide.items');
      rule('weibo.comment.my_comment', 'filter_comment_show_my');
      rule('weibo.comment.emoji_count', 'filter_comment_face_count');
      rule('weibo.comment.emoji_count.number', 'filter_comment_face_count.count');
      rule('weibo.comment.emoji_types', 'filter_comment_face_type');
      rule('weibo.comment.emoji_types.number', 'filter_comment_face_type.count');
      rule('weibo.comment.no_content', 'filter_comment_wo_content');
      rule('weibo.comment.with_forward', 'filter_comment_with_forward');
      // 界面清理
      rule('weibo.layoutHideIconLevel', 'clean_icons_level');
      rule('weibo.layoutHideIconMember', 'clean_icons_member');
      rule('weibo.layoutHideIconApprove', 'clean_icons_approve');
      rule('weibo.layoutHideIconApproveCo', 'clean_icons_approve_co');
      rule('weibo.layoutHideIconApproveDead', 'clean_icons_approve_dead');
      rule('weibo.layoutHideIconBigFun', 'clean_icons_bigfun');
      rule('weibo.layoutHideIconClub', 'clean_icons_club');
      rule('weibo.layoutHideIconVGirl', 'clean_icons_v_girl');
      rule('weibo.layoutHideIconSupervisor', 'clean_icons_supervisor');
      rule('weibo.layoutHideIconTaobao', 'clean_icons_taobao');
      rule('weibo.layoutHideIconCheng', 'clean_icons_cheng');
      rule('weibo.layoutHideIconGongyi', 'clean_icons_gongyi');
      rule('weibo.layoutHideIconZongyika', 'clean_icons_zongyika');
      rule('weibo.layoutHideIconOther', 'clean_icons_others');
      rule('weibo.layoutHideFollowSingle', 'clean_follow_single');
      rule('weibo.layoutHideFollowAtMe', 'clean_follow_at_me');
      rule('weibo.layoutHideFollowDiscover', 'clean_follow_discover');
      rule('weibo.layoutHideFollowWhisper', 'clean_follow_whisper');
      rule('weibo.layoutHideFollowVideo', 'clean_follow_video');
      rule('weibo.layoutHideFollowRecommend', 'clean_follow_recommend');
      rule('weibo.layoutHideNavLogoImg', 'clean_nav_logo_img');
      rule('weibo.layoutHideNavMain', 'clean_nav_main');
      rule('weibo.layoutHideNavTV', 'clean_nav_tv');
      rule('weibo.layoutHideNavHot', 'clean_nav_hot');
      rule('weibo.layoutHideNavGame', 'clean_nav_game');
      rule('weibo.layoutHideNavHotSearch', 'clean_nav_hot_search');
      rule('weibo.layoutHideNavNoticeNew', 'clean_nav_notice_new');
      rule('weibo.layoutHideNavNew', 'clean_nav_new');
      rule('weibo.layoutHideNavHotTip', 'clean_left_level');
      rule('weibo.layoutHideLeftNewFeed', 'clean_left_new_feed');
      rule('weibo.layoutHideLeftHome', 'clean_left_home');
      rule('weibo.layoutHideLeftFav', 'clean_left_fav');
      rule('weibo.layoutHideLeftLike', 'clean_left_like');
      rule('weibo.layoutHideLeftHot', 'clean_left_hot');
      rule('weibo.layoutHideLeftTV', 'clean_left_tv');
      rule('weibo.layoutHideLeftFriends', 'clean_left_friends');
      rule('weibo.layoutHideLeftGroupToMe', 'clean_left_group_to_me');
      rule('weibo.layoutHideLeftSpecial', 'clean_left_special');
      rule('weibo.layoutHideLeftWhisper', 'clean_left_whisper');
      rule('weibo.layoutHideLeftVPlus', 'clean_left_v_plus');
      rule('weibo.layoutHideLeftNew', 'clean_left_new');
      rule('weibo.layoutHideLeftNews', 'clean_left_news');
      rule('weibo.layoutHideLeftCount', 'clean_left_count');
      rule('weibo.layoutHideMiddleRecommendedTopic', 'clean_middle_recommended_topic');
      rule('weibo.layoutHideMiddleFeedRecommand', 'clean_middle_feed_recommend');
      rule('weibo.layoutHideMiddleMemberTip', 'clean_middle_member_tip');
      rule('weibo.layoutHideRightInfo', 'clean_right_info');
      rule('weibo.layoutHideRightRecomMusicRank', 'clean_right_ranks');
      rule('weibo.layoutHideRightHotTopic', 'clean_right_hot_topic');
      rule('weibo.layoutHideRightInterest', 'clean_right_interest');
      rule('weibo.layoutHideRightMember', 'clean_right_member');
      rule('weibo.layoutHideRightGroups', 'clean_right_groups');
      rule('weibo.layoutHideRightRecomGroupUser', 'clean_right_recom_group_user');
      rule('weibo.layoutHideRightHongbaoRank', 'clean_right_hongbao_rank');
      rule('weibo.layoutHideRightAttFeed', 'clean_right_att_feed');
      rule('weibo.layoutHideRightNotice', 'clean_right_notice');
      rule('weibo.layoutHideWeiboRecomFeed', 'clean_feed_recommend');
      rule('weibo.layoutHideWeiboFeedOuterTip', 'clean_feed_feed_outer_tip');
      rule('weibo.layoutHideWeiboFeedTip', 'clean_feed_feed_tip');
      rule('weibo.layoutHideWeiboGroupTip', 'clean_feed_group_tip');
      rule('weibo.layoutHideWeiboVIPBackground', 'clean_feed_vip_background');
      rule('weibo.layoutHideWeiboLastPic', 'clean_feed_last_pic');
      rule('weibo.layoutHideWeiboPicTag', 'clean_feed_pic_tag');
      rule('weibo.layoutHideWeiboSonTitle', 'clean_feed_son_title');
      rule('weibo.layoutHideWeiboCard', 'clean_feed_card');
      rule('weibo.layoutHideWeiboArticalPay', 'clean_feed_article_pay');
      rule('weibo.layoutHideWeiboTag', 'clean_feed_tag');
      rule('weibo.layoutHideWeiboMovieTag', 'clean_feed_related_link');
      rule('weibo.layoutHideWeiboSource', 'clean_feed_source');
      rule('weibo.layoutHideWeiboPop', 'clean_feed_pop');
      rule('weibo.layoutHideWeiboLike', 'clean_feed_like');
      rule('weibo.layoutHideWeiboLikeComment', 'clean_feed_like_comment');
      rule('weibo.layoutHideWeiboLikePopup', 'clean_feed_like_attitude');
      rule('weibo.layoutHideWeiboForward', 'clean_feed_forward');
      rule('weibo.layoutHideWeiboFavourite', 'clean_feed_favorite');
      rule('weibo.layoutHideWeiboPromoteOther', 'clean_feed_promote_other');
      rule('weibo.layoutHideWeiboReport', 'clean_feed_report');
      rule('weibo.layoutHideWeiboUseCardBackground', 'clean_feed_use_card_background');
      rule('weibo.layoutHidePersonMoveThings', 'clean_profile_move_things');
      rule('weibo.layoutHidePersonCover', 'clean_profile_cover');
      rule('weibo.layoutHidePersonBGImg', 'clean_profile_bg_img');
      rule('weibo.layoutHidePersonBadgeIcon', 'clean_profile_badge_icon');
      rule('weibo.layoutHidePersonVerify', 'clean_profile_verify');
      rule('weibo.layoutHidePersonEditPersonInfo', 'clean_profile_edit_person_info');
      rule('weibo.layoutHidePersonStats', 'clean_profile_stats');
      rule('weibo.layoutHidePersonMyData', 'clean_profile_my_data');
      rule('weibo.layoutHidePersonSuggestUser', 'clean_profile_suggest_user');
      rule('weibo.layoutHidePersonGroup', 'clean_profile_group');
      rule('weibo.layoutHidePersonRelation', 'clean_profile_relation');
      rule('weibo.layoutHidePersonAlbum', 'clean_profile_album');
      rule('weibo.layoutHidePersonHotTopic', 'clean_profile_hot_topic');
      rule('weibo.layoutHidePersonHotWeibo', 'clean_profile_hot_weibo');
      rule('weibo.layoutHidePersonUserList', 'clean_profile_recommend_feed');
      rule('weibo.layoutHidePersonHongbao', 'clean_profile_user_list');
      rule('weibo.layoutHidePersonWenwoDr', 'clean_profile_hongbao');
      rule('weibo.layoutHidePersonTimeline', 'clean_profile_wenwo_dr');
      rule('weibo.layoutHideMessagesHelp', 'clean_profile_timeline');
      rule('weibo.layoutHideMessagesFeedback', 'clean_message_help');
      rule('weibo.layoutHideMessagesYoudao', 'clean_message_feedback');
      rule('weibo.layoutHideOtherAds', 'clean_other_ads');
      rule('weibo.layoutHideOtherMusic', 'clean_other_music');
      rule('weibo.layoutHideOtherTemplate', 'clean_other_template');
      rule('weibo.layoutHideOtherHomeTip', 'clean_other_home_tip');
      rule('weibo.layoutHideOtherFooter', 'clean_other_footer');
      rule('weibo.layoutHideOtherWbIm', 'clean_other_im');
      rule('weibo.layoutHideOtherIM', 'clean_other_im_news');
      rule('weibo.layoutHideOtherIMNews', 'clean_other_back_top');
      rule('weibo.layoutHideOtherTip', 'clean_other_tip');
      rule('weibo.layoutHideOtherRelatedWB', 'clean_other_related_feeds');
      rule('weibo.layoutHideOtherRelatedVideo', 'clean_other_related_video');
      rule('weibo.layoutHideOtherRelatedArtical', 'clean_other_related_artical');
      rule('weibo.layoutHideOtherSendWeibo', 'clean_other_send_weibo');
      // 版面展示
      rule('weibo.tool.hide_nav_bar', 'layout_nav_auto_hide');
      rule('weibo.tool.reorder_nav_bar', 'layout_nav_classical');
      rule('weibo.tool.nav_hide_name', 'layout_nav_hide_name');
      rule('weibo.tool.nav_hide_name.act', 'layout_nav_hide_name.act');
      rule('weibo.tool.showAllMsgNav', 'layout_left_messages');
      rule('weibo.tool.showAllMsgNav.atme', 'layout_left_messages.atme');
      rule('weibo.tool.showAllMsgNav.cmt', 'layout_left_messages.cmt');
      rule('weibo.tool.showAllMsgNav.like', 'layout_left_messages.like');
      rule('weibo.tool.showAllMsgNav.dm', 'layout_left_messages.dm');
      rule('weibo.tool.showAllMsgNav.msgbox', 'layout_left_messages.msgbox');
      rule('weibo.tool.showAllMsgNav.group', 'layout_left_messages.group');
      rule('weibo.tool.showAllMsgNav.dmsub', 'layout_left_messages.dmsub');
      rule('weibo.tool.mergeColumns', 'layout_side_merge');
      rule('weibo.tool.mergeColumns.side', 'layout_side_merge.side');
      rule('weibo.tool.chose_side', 'layout_side_position');
      rule('weibo.tool.chose_side.side', 'layout_side_position.side');
      rule('weibo.tool.showAllGroup', 'layout_side_show_all_groups');
      rule('weibo.tool.fixedLeft', 'layout_left_move');
      rule('weibo.tool.fixedRight', 'layout_right_move');
      rule('weibo.tool.fixedOthers', 'layout_other_move');
      rule('weibo.tool.custom_font_family', 'font_family');
      rule('weibo.tool.custom_font_family.wf', 'font_family.west');
      rule('weibo.tool.custom_font_family.cf', 'font_family.chinese');
      rule('weibo.tool.avatar_shape', 'layout_avatar_shape');
      rule('weibo.tool.avatar_shape.shape', 'layout_avatar_shape.shape');
      rule('weibo.tool.fast_emoji', 'layout_fast_face');
      rule('weibo.tool.show_local_time', 'layout_locale_timezone');
      rule('weibo.tool.set_skin', 'layout_theme_apply');
      rule('weibo.tool.set_skin.skin', 'layout_theme_apply.skin');
      rule('weibo.tool.dark_nav_bar', 'layout_nav_dark');
      rule('weibo.tool.color_override', 'layout_theme_color');
      rule('weibo.tool.color_override.color1', 'layout_theme_color.color1');
      rule('weibo.tool.color_override.transparency1', 'layout_theme_color.transparency1');
      rule('weibo.tool.color_override.color2', 'layout_theme_color.color2');
      rule('weibo.tool.color_override.transparency2', 'layout_theme_color.transparency2');
      rule('weibo.tool.color_override.color3', 'layout_theme_color.color3');
      rule('weibo.tool.color_override.transparency3', 'layout_theme_color.transparency3');
      rule('weibo.tool.userstyle', 'custom_css');
      // 微博展示
      rule('weibo.tool.no_weibo_space', 'feed_no_space');
      rule('weibo.tool.from_in_bottom', 'feed_source_at_bottom');
      rule('weibo.tool.unwrapText', 'feed_author_content_nowrap');
      rule('weibo.tool.image_size', 'feed_small_image');
      rule('weibo.tool.image_size.repost', 'feed_small_image.repost');
      rule('weibo.tool.width_weibo', 'feed_increase_width');
      rule('weibo.tool.width_weibo.width', 'feed_increase_width.width');
      rule('weibo.layout.reorder', 'feed_button_order');
      rule('weibo.layout.reorder.1', 'feed_button_order.0');
      rule('weibo.layout.reorder.2', 'feed_button_order.1');
      rule('weibo.layout.reorder.3', 'feed_button_order.2');
      rule('weibo.layout.reorder.4', 'feed_button_order.3');
      rule('weibo.layout.reorder.5', 'feed_button_order.4');
      rule('weibo.layout.cmtorder', 'feed_button_order_comment');
      rule('weibo.layout.cmtorder.1', 'feed_button_order_comment.0');
      rule('weibo.layout.cmtorder.2', 'feed_button_order_comment.1');
      rule('weibo.layout.cmtorder.3', 'feed_button_order_comment.2');
      rule('weibo.layout.cmtorder.4', 'feed_button_order_comment.3');
      rule('weibo.layout.cmtorder.5', 'feed_button_order_comment.4');
      rule('weibo.tool.noTagDialog', 'feed_disable_tag_dialog');
      rule('weibo.tool.highlight_low_reading', 'feed_low_reading_warn');
      rule('weibo.tool.weibo_large_font', 'feed_font_size');
      rule('weibo.tool.weibo_large_font.ratio', 'feed_font_size.ratio');
      rule('weibo.tool.auto_unfold_weibo', 'feed_long_expand');
      rule('weibo.tool.auto_unfold_weibo.count', 'feed_long_expand.count');
      rule('weibo.tool.auto_unfold_weibo.br', 'feed_long_expand.br');
      rule('weibo.tool.unwrapContent', 'feed_content_line_break');
      rule('weibo.tool.unwrapContent.text', 'feed_content_line_break.text');
      rule('weibo.tool.replace_link', 'feed_link_use_url');
      rule('weibo.tool.replace_image_emoji', 'feed_unicode_emoji');
      rule('weibo.tool.show_vote_result', 'show_vote_result');
      rule('weibo.other.customize_source', 'feed_no_custom_source');
      rule('weibo.tool.viewOriginal', 'feed_view_original');
      rule('weibo.tool.viewOriginal.open', 'feed_view_original.open');
      rule('weibo.tool.viewOriginal.direct', 'feed_view_original.direct');
      rule('weibo.tool.downloadImage', 'feed_download_image');
      rule('weibo.tool.downloadImage.direct', 'feed_download_image.direct');
      rule('weibo.tool.pause_animated_image', 'feed_no_animated_image');
      rule('weibo.tool.use_built_in_video_player', 'feed_built_in_video_player');
      rule('weibo.tool.use_built_in_video_player.volume', 'feed_built_in_video_player.volume');
      rule('weibo.tool.use_built_in_video_player.memorize', 'feed_built_in_video_player.memorize');
    }
  }

  importer.addParser(function yawf(dataArrayBuffer) {
    const decoder = new TextDecoder();
    const text = decoder.decode(dataArrayBuffer);
    const data = JSON.parse(text);
    if (!data.ver || !data.yawf || !data.conf) throw TypeError();
    const config = new Converter().convert(data.conf);
    return { config, source: i18n.yawfScriptSource };
  });

}());
