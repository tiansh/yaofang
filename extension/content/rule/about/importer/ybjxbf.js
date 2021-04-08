; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const i18n = util.i18n;

  const importer = yawf.importer;

  i18n.ybjxbfScriptSource = {
    cn: '眼不见心不烦',
    tw: '眼不見心不煩',
  };

  class Converter {
    constructor() {
      /** @type {Map<string, ((value: any) => ({ [target: string]: any }))[]>} */
      this.rules = new Map();
      /** @type {Map<string, (() => ({ [target: string]: true }))[]>} */
      this.cleans = new Map();
      /** @type {Map<string, ((items: Array<any>) => ({ [target: string]: Array<any> }))[]>} */
      this.collections = new Map();
      this.initialize();
    }
    convert(wbp) {
      const configs = {};
      wbp.hideMods?.forEach(mod => {
        Object.assign(configs, ...(this.cleans.get(mod) ?? []).map(clean => clean() ?? {}));
      });
      Object.keys(wbp).forEach(key => {
        Object.assign(configs, ...(this.rules.get(key) ?? []).map(rule => rule(wbp[key]) ?? {}));
      });
      Object.keys(wbp).forEach(key => {
        if (!this.collections.has(key)) return;
        this.collections.get(key)?.forEach(mapper => {
          const conf = mapper(wbp[key]);
          Object.keys(conf).forEach(ckey => {
            configs[ckey] = (configs[ckey] ?? []).concat(conf[ckey]);
          });
        });
      });
      return configs;
    }
    /**
     * @param {(item: any) => Array<any>} map
     */
    collection(source, target, map) {
      if (!this.collections.has(source)) {
        this.collections.set(source, []);
      }
      this.collections.get(source).push(items => ({
        [target]: items.map(item => map(item))
          .reduce((result, append) => result.concat(append), []),
      }));
    }
    rule(source, target, map) {
      if (!this.rules.has(source)) {
        this.rules.set(source, []);
      }
      if (!map) {
        this.rules.get(source).push(value => value ? { [target]: true } : {});
      } else {
        this.rules.get(source).push(value => {
          const result = map(value);
          if (result !== void 0) return { [target]: result };
          return {};
        });
      }
    }
    clean(source, target) {
      if (!this.cleans.has(source)) {
        this.cleans.set(source, []);
      }
      this.cleans.get(source).push(() => ({ [target]: true }));
    }
    initialize() {
      const collection = this.collection.bind(this);
      const clean = this.clean.bind(this);
      const rule = this.rule.bind(this);

      const keywordMapper = keyword => /^\/.+\/$|\+/.test(keyword) ? [] : [keyword];
      const regexMapper = keyword => {
        if (/^\/.+\/$/.test(keyword)) try {
          const regex = new RegExp(keyword.slice(1, -1), 'mu');
          return [{ source: regex.source, flags: regex.flags }];
        } catch (e) { /* ignore */ } else if (/\+/.test(keyword)) {
          const words = keyword.split('+');
          const regex = RegExp('^' + words.map(p => `(?=[\\s\\S]*${p.replace(/([.*+?^${}()|[\]/\\])/g, '\\$1')})`).join(''), 'mu');
          return [{ source: regex.source, flags: regex.flags }];
        }
        return [];
      };
      const userIdMapper = userId => [{ id: userId }];
      const textMapper = text => [text];

      collection('whiteKeywords', 'filter_content_text_show.items', keywordMapper);
      collection('blackKeywords', 'filter_content_text_hide.items', keywordMapper);
      collection('grayKeywords', 'filter_content_text_fold.items', keywordMapper);
      collection('whiteKeywords', 'filter_content_regex_show.items', regexMapper);
      collection('blackKeywords', 'filter_content_regex_hide.items', regexMapper);
      collection('grayKeywords', 'filter_content_regex_fold.items', regexMapper);
      collection('userBlacklist', 'filter_author_id_hide.items', userIdMapper);
      collection('userBlacklist', 'filter_original_id_hide.items', userIdMapper);
      collection('sourceKeywords', 'filter_source_text_hide.items', textMapper);
      collection('sourceGrayKeywords', 'filter_source_text_fold.items', textMapper);
      collection('URLKeywords', 'filter_comment_name_show.items', textMapper);

      rule('filterOthersOnly', 'filter_my_feed');
      rule('filterOthersOnly', 'filter_my_original');
      rule('filterPromotions', 'filter_ad_feed');
      rule('filterHot', 'filter_fans_top');
      rule('filterTaobao', 'filter_tb_tm_feed');
      rule('filterDeleted', 'filter_deleted_forward');
      rule('filterFlood', 'weibo.other.same_account');
      rule('maxFlood', 'weibo.other.same_account.number', Number);
      rule('showAllMsgNav', 'layout_left_messages');
      rule('showAllGroups', 'layout_side_show_all_groups');
      rule('noHomeMargins', 'layout_side_merge');
      rule('showAllText', 'feed_long_expand');
      rule('showAllArticleText', 'show_article_without_follow');
      rule('directAllFeeds', 'filter_profile_show_all');
      rule('directBigImg', 'feed_view_original');
      rule('squareAvatar', 'layout_avatar_shape');
      rule('skinID', 'layout_theme_apply.skin', value => value);
      rule('overrideMySkin', 'layout_theme_apply');
      rule('unwrapText', 'feed_author_content_nowrap');
      rule('smallImgLayout', 'feed_small_image');
      rule('compactFeedToolbar', 'feed_no_space');
      rule('noHomeMargins', 'feed_no_space');
      rule('moveSrcToBtm', 'feed_source_at_bottom');
      rule('unwrapText', 'feed_author_content_nowrap');
      rule('customStyles', 'custom_css');

      clean('TimelineMods', 'filter_fake_weibo');
      clean('Level', 'clean_icons_level');
      clean('MemberIcon', 'clean_icons_member');
      clean('VerifyIcon', 'clean_icons_approve');
      clean('VerifyIcon', 'clean_icons_approve_co');
      clean('VerifyIcon', 'clean_icons_approve_dead');
      clean('DarenIcon', 'clean_icons_club');
      clean('VgirlIcon', 'clean_icons_v_girl');
      clean('TaobaoIcon', 'clean_icons_taobao');
      clean('GongyiIcon', 'clean_icons_gongyi');
      clean('PaiIcon', 'clean_icons_others');
      clean('HotSearch', 'clean_nav_hot_search');
      clean('HotWeibo', 'clean_left_hot');
      clean('Friends', 'clean_left_friends');
      clean('ToMe', 'clean_left_group_to_me');
      clean('RecommendedTopic', 'clean_middle_recommended_topic');
      clean('RecomFeed', 'clean_middle_feed_recommend');
      clean('MemberTip', 'clean_middle_member_tip');
      clean('MusicRecom', 'clean_right_ranks');
      clean('Topic', 'clean_right_hot_topic');
      clean('Member', 'clean_right_member');
      clean('Hongbao', 'clean_right_hongbao_rank');
      clean('MovieRecom', 'clean_right_member');
      clean('AttFeed', 'clean_right_att_feed');
      clean('Notice', 'clean_right_notice');
      clean('RecomFeed', 'clean_feed_recommend');
      clean('CommentTip', 'clean_feed_feed_tip');
      clean('MemberCover', 'clean_feed_vip_background');
      clean('TopicCard', 'clean_feed_card');
      clean('LocationCard', 'clean_feed_card');
      clean('ProfCover', 'clean_profile_cover');
      clean('ProfStats', 'clean_profile_stats');
      clean('Relation', 'clean_profile_relation');
      clean('Album', 'clean_profile_album');
      clean('Ads', 'clean_other_ads');
      clean('MusicPlayer', 'clean_other_music');
      clean('Footer', 'clean_other_footer');
      clean('FeedRecom', 'clean_other_related_feeds');
      clean('FeedRecom', 'clean_other_related_video');
      clean('IMNews', 'clean_other_im_news');
    }
  }

  const convertData = data => {
    if (!Array.isArray(data.hideMods)) throw TypeError();
    const config = new Converter().convert(data);
    return { config, source: i18n.ybjxbfScriptSource };
  };

  importer.addParser(function ybjxbf(dataArrayBuffer) {
    let text = null;
    const decoder = new TextDecoder();
    text = decoder.decode(dataArrayBuffer);
    const data = JSON.parse(text);
    return convertData(data);
  });

  importer.ybjxbfConvert = data => {
    return convertData(data);
  };

}());
