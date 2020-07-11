
; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const clean = yawf.rules.clean;

  const i18n = util.i18n;

  Object.assign(i18n, {
    cleanFollowGroupTitle: { cn: '隐藏模块 - 关注按钮', tw: '隱藏模組 - 關注按鈕', en: 'Hide Modules - Follow Button' },
    cleanFollowSingle: { cn: '微博详情页', tw: '微博詳情頁', en: 'Weibo detail' },
    cleanFollowAtMe: { cn: '提到我的微博', en: 'Weibo mentioned me' },
    cleanFollowDiscover: { cn: '热门微博', tw: '熱門微博', en: 'Hot Weibo' },
    cleanFollowFastForward: { cn: '快转', tw: '快轉', en: 'Fast Forward' },
    cleanFollowVideo: { cn: '视频弹层', hk: '視頻彈層', tw: '影片快顯層', en: 'Video pop-up layer' },
    cleanFollowRecommend: { cn: '关注推荐', tw: '關注推薦', en: 'Follow Recommend' },
  });

  clean.CleanGroup('follow', () => i18n.cleanFollowGroupTitle);
  clean.CleanRule('single', () => i18n.cleanFollowSingle, 1, '[id^="Pl_Official_WeiboDetail__"] [node-type*="feed_recommend_follow"] { display: none !important; }');
  clean.CleanRule('at_me', () => i18n.cleanFollowAtMe, 1, '#v6_pl_content_atmeweibo [node-type*="feed_recommend_follow"] { display: none !important; }');
  clean.CleanRule('discover', () => i18n.cleanFollowDiscover, 1, '#plc_discover [node-type*="feed_recommend_follow"] { display: none !important; }');
  clean.CleanRule('fast_forward', () => i18n.cleanFollowFastForward, 1, '#v6_pl_content_homefeed [node-type*="feed_recommend_follow"] { display: none !important; }');
  clean.CleanRule('video', () => i18n.cleanFollowVideo, 1, '.WB_h5video .con-11, .wbv-add-box { display: none !important; }');
  clean.CleanRule('recommend', () => i18n.cleanFollowRecommend, 1, '[action-type="follow_recommend_arr"], [node-type="follow_recommend_box"] { display: none !important; }');

}());
