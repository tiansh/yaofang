; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const observer = yawf.observer;

  const i18n = util.i18n;
  const css = util.css;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanProfileGroupTitle: { cn: '隐藏模块 - 个人主页', tw: '隱藏模組 - 個人主頁', en: 'Hide modules - Personal home page' },
    cleanProfileMoveThings: { cn: '移动部件（会员模板）', tw: '移動部件（會員模板）', en: 'Moving Things (VIP Template)' },
    cleanProfileCover: { cn: '封面图', tw: '封面圖', en: 'Cover Picture' },
    cleanProfileBGImg: { cn: '背景图', tw: '背景圖', en: 'Background Picture' },
    cleanProfileBadgeIcon: { cn: '勋章', tw: '勳章', en: 'Badges' },
    cleanProfileVerify: { cn: '个人资料认证', tw: '個人資料認證', en: 'Person Info Verification' },
    cleanProfileEditPersonInfo: { cn: '编辑个人资料', tw: '编辑个人资料', en: 'Edit personal info' },
    cleanProfileStats: { cn: '关注/粉丝/微博数', tw: '關注/粉絲/微博數', en: 'Numbers of Following/Followers/Weibo' },
    cleanProfileMyData: { cn: '我的微博人气', tw: '我的微博人氣', en: 'Weibo Popularity' },
    cleanProfileSuggestUser: { cn: '可能感兴趣的人', tw: '可能感興趣的人', en: 'Suggested' },
    cleanProfileGroup: { cn: '公开分组', tw: '公開分組', en: 'Public Groups' },
    cleanProfileRelation: { cn: '微关系', tw: '微關係', en: 'Weibo relations' },
    cleanProfileAlbum: { cn: '相册', tw: '相冊', en: 'Album' },
    cleanProfileHotTopic: { cn: '话题', tw: '話題', en: 'Topic' },
    cleanProfileHotWeibo: { cn: '热门微博', tw: '熱門微博', en: 'Hot Weibo' },
    cleanProfileUserList: { cn: '与他/她相似的人', tw: '與他/她相似的人', en: 'Similar People' },
    cleanProfileHongbao: { cn: '微博红包', tw: '微博紅包', en: 'Red pack' },
    cleanProfileWenwoDr: { cn: '爱问医生', tw: '愛問醫生', en: 'Iask medical' },
    cleanProfileTimeline: { cn: '时间轴', tw: '時間軸', en: 'Timeline' },
  });

  clean.CleanGroup('profile', () => i18n.cleanProfileGroupTitle);
  clean.CleanRule('move_things', () => i18n.cleanProfileMoveThings, 1, '.profile_move_things { display: none !important; }');
  clean.CleanRule('cover', () => i18n.cleanProfileCover, 1, function () {
    css.append(`
.PCD_header.PCD_header,
.PCD_header.PCD_header .pf_wrap { height: 130px; overflow: hidden; }
.PCD_header.PCD_header .cover_wrap { display: none; }
.PCD_header.PCD_header .shadow { width: 440px; height: 108px; margin: 11px auto; position: relative; padding: 0 20px 0 140px; }
.PCD_header.PCD_header .pf_photo { position: absolute; left: 20px; top: 0; margin: 0; }
.PCD_header.PCD_header .upcover { display: none; }
.PCD_header.PCD_header .pf_username,
.PCD_header.PCD_header .pf_intro { text-align: left; }
    `);
    observer.dom.add(function fullProfileIntroduction() {
      const intro = document.querySelector('.PCD_header .pf_intro:not([yawf-full-intro])');
      if (!intro) return;
      intro.setAttribute('yawf-full-intro', (intro.textContent = intro.title));
    });
  });
  clean.CleanRule('bg_img', () => i18n.cleanProfileBGImg, 1, '.S_page, .S_page .WB_miniblog { background-image: url("\'\'") !important; }');
  clean.CleanRule('badge_icon', () => i18n.cleanProfileBadgeIcon, 1, '.pf_badge_icon { display: none !important; }');
  clean.CleanRule('verify', () => i18n.cleanProfileVerify, 1, '[yawf-id="yawf-pr-pcd-person-info-my"] .verify_area, [yawf-id="yawf-pr-pcd-person-info"] .verify_area { display: none !important; }');
  clean.CleanRule('edit_person_info', () => i18n.cleanProfileEditPersonInfo, 1, '[yawf-id="yawf-pr-pcd-person-info-my"] { display: none !important; }');
  clean.CleanRule('stats', () => i18n.cleanProfileStats, 1, '[yawf-id="yawf-pr-pcd-counter"] { display: none !important; }');
  clean.CleanRule('my_data', () => i18n.cleanProfileMyData, 1, '[id^="Pl_Official_MyMicroworld__"], .WB_frame_b [id^="Pl_Official_MyPopularity__"] { display: none !important; }');
  clean.CleanRule('suggest_user', () => i18n.cleanProfileSuggestUser, 1, '[id^="Pl_Core_RightUserList__"], .WB_frame_b [id^="Pl_Core_RightUserList__"] { display: none !important; }');
  clean.CleanRule('group', () => i18n.cleanProfileGroup, 1, '[id^="Pl_Core_UserGrid__"] { display: none !important; }');
  clean.CleanRule('relation', () => i18n.cleanProfileRelation, 1, '[id^="Pl_Core_RightUserGrid__"], .WB_frame_b [id^="Pl_Core_RightUserGrid__"] { display: none !important; }');
  clean.CleanRule('album', () => i18n.cleanProfileAlbum, 1, '[id^="Pl_Core_RightPicMulti__"], .WB_frame_b [id^="Pl_Core_RightPicMulti__"], [yawf-obj-name="相冊"], [yawf-obj-name="相册"], [yawf-id="yawf-core-right-pic-multi"] { display: none !important; }');
  clean.CleanRule('hot_topic', () => i18n.cleanProfileHotTopic, 1, '[id^="Pl_Core_RightTextSingle__"], .WB_frame_b [id^="Pl_Core_RightTextSingle__"] { display: none !important; }');
  clean.CleanRule('hot_weibo', () => i18n.cleanProfileHotWeibo, 1, '[id^="Pl_Core_RightPicText__"], .WB_frame_b [id^="Pl_Core_RightPicText__"] { display: none !important; }');
  clean.CleanRule('user_list', () => i18n.cleanProfileUserList, 1, '[id^="Pl_Core_Ut1UserList__"], .WB_frame_b [id^="Pl_Core_RightPicText__"] { display: none !important; }');
  clean.CleanRule('hongbao', () => i18n.cleanProfileHongbao, 1, '[yawf-id="yawf-pr-hongbao"], .WB_red2017 { display: none !important; }');
  clean.CleanRule('wenwo_dr', () => i18n.cleanProfileWenwoDr, 1, '[yawf-obj-name="爱问医生"] { display: none !important; }'); // 对应模块没有繁体或英文翻译
  clean.CleanRule('timeline', () => i18n.cleanProfileTimeline, 1, '[id^="Pl_Official_TimeBase__"] { display: none !important; }');

  clean.tagElements('Profile', [
    '.WB_frame_b > div:not(:empty):not([yawf-id])',
  ].join(','), {
    '.PCD_counter': 'yawf-pr-pcd-counter',
    '.PCD_person_info': 'yawf-pr-pcd-person-info',
    '.PCD_photolist': 'yawf-core-right-pic-multi',
    '.WB_cardwrap[action-data*="weibo.com%2Fhongbao"]': 'yawf-pr-hongbao',
    '.WB_cardwrap[action-data*="sina.com.cn%2Fhongbao"]': 'yawf-pr-hongbao',
    'a[href*="//hongbao.weibo.com/hongbao"]': 'yawf-pr-hongbao',
    '.PCD_person_info a.WB_cardmore[href^="/p/"][href$="info?mod=pedit"]': 'yawf-pr-pcd-person-info-my',
  });

  observer.dom.add(function tagProfileLeftNames() {
    const titles = Array.from(document.querySelectorAll([
      '.WB_frame_b > div:not([yawf-obj-name]) .main_title',
      '.WB_frame_c > div:not([yawf-obj-name]) .main_title',
    ].join(',')));
    if (!titles.length) return;
    titles.forEach(function (title) {
      const name = title && title.textContent.trim() || '';
      const container = title.closest('.WB_frame_b > div, .WB_frame_c > div');
      if (!container.hasAttribute('yawf-obj-name')) {
        container.setAttribute('yawf-obj-name', name);
      }
    });
  });

}());
