; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const i18n = util.i18n;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanRightGroupTitle: { cn: '隐藏模块 - 右栏', tw: '隱藏模組 - 右欄', en: 'Hide modules - Right Column' },
    cleanRightInfo: { cn: '个人信息', tw: '个人信息', en: 'Personal Info' },
    cleanRightV7Entry: { cn: '切换到新版' },
    cleanRightRanks: { cn: '榜单（新歌榜等）', tw: '榜單（新歌榜等）', en: 'Rank List (Song list, etc.)' },
    cleanRightHotTopic: { cn: '热门话题 / 微博热搜', tw: '熱門話題', en: 'Hot Topic' },
    cleanRightHotTopicTop: { cn: '置顶热门话题 (V7)' },
    cleanRightInterest: { cn: '可能感兴趣的人', tw: '可能感興趣的人', en: 'You may know' },
    cleanRightService: { cn: '创作者中心' },
    cleanRightMember: { cn: '会员专区', tw: '會員專區', en: 'Weibo VIP' },
    cleanRightGroups: { cn: '分组成员列表', tw: '分組成員列表', en: 'Members of group' },
    cleanRightRecomGroupUser: { cn: '建议加入该分组', tw: '建議加入該分組', en: 'Suggest to add to this group' },
    cleanRightHongbaoRank: { cn: '让红包飞', tw: '讓紅包飛', en: '让红包飞 (Red Envelope)' },
    cleanRightAttFeed: { cn: '好友关注动态 {{i}}', tw: '好友關注動態 {{i}}', en: "Friends' Attention {{i}}" },
    cleanRightAttFeedDetail: {
      cn: '开启该隐藏选项只能让您自己不再看到“好友关注动态”模块，并不能阻止您出现在别人的“好友关注动态”中。',
    },
    cleanRightNotice: { cn: '公告栏', tw: '公告欄', en: 'Bulletin Board' },
  });

  clean.CleanGroup('right', () => i18n.cleanRightGroupTitle);
  clean.CleanRule('info', () => i18n.cleanRightInfo, 1, '[yawf-id="v6_pl_rightmod_myinfo_myinfo"] { display: none !important; }');
  clean.CleanRule('v7_entry', () => i18n.cleanRightV7Entry, 91, '[yawf-id="v6_pl_rightmod_myinfo_new_pc_apply"] { display: none !important; }');
  clean.CleanRule('ranks', () => i18n.cleanRightRanks, 1, '#v6_pl_rightmod_rank, [yawf-id="rightmod_taobao_movie"], [yawf-id="rightmod_recom_movie"] { display: none !important; }');
  const hotSearchTop = clean.CleanRule('hot_topic_top', () => i18n.cleanRightHotTopicTop, 91, '', { v7Support: true });
  const hotSearch = clean.CleanRule('hot_topic', () => i18n.cleanRightHotTopic, 1, '', { v7Support: true });
  const interested = clean.CleanRule('interest', () => i18n.cleanRightInterest, 1, '', { v7Support: true });
  const service = clean.CleanRule('service', () => i18n.cleanRightService, 104, '', { v7Support: true });
  clean.CleanRule('member', () => i18n.cleanRightMember, 1, '#v6_trustPagelet_recom_member { display: none !important; }');
  clean.CleanRule('groups', () => i18n.cleanRightGroups, 1, '#v6_pl_rightmod_groups { display: none; }');
  clean.CleanRule('recom_group_user', () => i18n.cleanRightRecomGroupUser, 1, '#v6_pl_rightmod_recomgroupuser { display: none; }');
  clean.CleanRule('hongbao_rank', () => i18n.cleanRightHongbaoRank, 1, '#v6_pl_rightmod_hongbao { display: none !important; }');
  clean.CleanRule('att_feed', () => i18n.cleanRightAttFeed, 1, {
    acss: '#v6_pl_rightmod_attfeed { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanRightAttFeedDetail } },
  });
  clean.CleanRule('notice', () => i18n.cleanRightNotice, 1, '#v6_pl_rightmod_noticeboard { display: none !important; }');

  clean.tagElements('Right', [
    '#trustPagelet_indexright_recom .WB_right_module:not([yawf-id])',
    '#v6_pl_rightmod_recominfo .WB_cardwrap:not([yawf-id])',
    '#v6_pl_rightmod_rank .WB_cardwrap:not([yawf-id])',
    '#v6_pl_rightmod_myinfo .WB_cardwrap:not([yawf-id])',
  ].join(','), {
    '[change-data*="key=hottopic_r2"]': 'rightmod_zt_hottopic',
    '[change-data*="key=interest_r2"]': 'rightmod_recom_interest',
    'h4.obj_name a[href*="movie.weibo.com"]': 'rightmod_recom_movie',
    'h4.obj_name a[href*="taobao.com"][href*="dianying"]': 'rightmod_taobao_movie',
    'h2.main_title a[href*="book.weibo.com/top"]': 'v6_pl_rightmod_rank_book',
    'h4.obj_name a[href*="pop.weibo.com"]': 'v6_pl_rightmod_rank_pop',
    'div.obj_name a[href*="100808faecebff8a54b97a91699c654e5f4cda"]': 'v6_pl_rightmod_rank_hong',
    '.W_person_info': 'v6_pl_rightmod_myinfo_myinfo',
    'a[action-type="new_pc_apply"]': 'v6_pl_rightmod_myinfo_new_pc_apply',
  });

  clean.CleanRuleGroup({
    hotSearchTop: hotSearchTop,
    cardHotSearch: hotSearch,
    cardInterested: interested,
    cardService: service,
  }, function (options) {
    util.inject(function (rootKey, options) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      vueSetup.eachComponentVM('side', function (vm) {
        vm.$watch(function () { return this.cardsData; }, function () {
          if (Array.isArray(vm.cardsData)) {
            if (vm.cardsData?.length) vm.$parent.isLoaded = true;
            for (let i = 0; i < vm.cardsData?.length;) {
              const cardData = vm.cardsData[i];
              if (cardData == null || options[cardData.card_type]) {
                vm.cardsData.splice(i, 1);
              } else i++;
            }
          }
        }, { immediate: true });
      });

      if (options.hotSearchTop) {
        vueSetup.eachComponentVM('card-hot-search', function (vm) {
          vm.$watch(function () { return this.TopWord; }, function () {
            if (vm.TopWord) vm.TopWord = null;
          });
        }, { immediate: true });
      }
    }, util.inject.rootKey, options);
  });

}());
