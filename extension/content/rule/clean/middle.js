; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const i18n = util.i18n;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanMiddleGroupTitle: { cn: '隐藏模块 - 中栏', tw: '隱藏模組 - 中欄', en: 'Hide modules - Middle Column' },
    cleanMiddleRecommendedTopic: { cn: '热门微博（发布框上方）', hk: '热门微博（發布框上方）', tw: '熱門微博（發布框上方）', en: 'Hot feeds, on top of publisher' },
    cleanMiddleFeedRecommend: { cn: '微博兴趣推荐（顶部）', tw: '微博興趣推薦（頂部）', en: 'Feed Recommendation, top' },
    cleanMiddleMemberTip: { cn: '开通会员提示（底部）', tw: '開通會員提示（底部）', en: 'Tip of Joining Weibo VIP, bottom' },
  });

  clean.CleanGroup('middle', () => i18n.cleanMiddleGroupTitle);
  clean.CleanRule('recommended_topic', () => i18n.cleanMiddleRecommendedTopic, 1, '#v6_pl_content_publishertop div[node-type="recommendTopic"] { display: none !important; }');
  clean.CleanRule('feed_recommend', () => i18n.cleanMiddleFeedRecommend, 1, 'a.notes[node-type="feed_list_newBar"][href^="http"]:not([action-type="feed_list_newBar"]), .WB_feed_newuser[node-type="recommfeed"] { display: none !important; }');
  clean.CleanRule('member_tip', () => i18n.cleanMiddleMemberTip, 1, '[node-type="feed_list_shieldKeyword"] { display: none !important; }');

}());
