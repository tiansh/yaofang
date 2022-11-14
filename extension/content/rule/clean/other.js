; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const backend = yawf.backend;
  const observer = yawf.observer;
  const init = yawf.init;

  const i18n = util.i18n;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanOtherGroupTitle: { cn: '隐藏模块 - 杂项', tw: '隱藏模組 - 雜項', en: 'Hide modules - Others' },
    cleanOtherAds: { cn: '广告', tw: '廣告', en: 'Advertisement' },
    cleanOtherTracker: { cn: '追踪器（部分）', en: 'Trackers (Partial)' },
    cleanOtherMusic: { cn: '微音乐', tw: '微音樂', en: 'Weibo Music' },
    cleanOtherTemplate: { cn: '设置模板', tw: '背景設定', en: 'Template Settings' },
    cleanOtherHomeTip: { cn: '顶部提示横幅 {{i}}', tw: '頂部提示橫幅 {{i}}', en: 'Top tips banner {{i}}' },
    cleanOtherHomeTipDetail: {
      cn: '出现在导航栏下方其他所有内容的上方的横幅。一般用来推荐微博重要的新功能。',
    },
    cleanOtherFooter: { cn: '页面底部 {{i}}', tw: '頁面底部 {{i}}', en: 'Footer {{i}}' },
    cleanOtherFooterDetail: {
      cn: '页面底部的导航链接。',
    },
    cleanOtherIM: { cn: '私信聊天（右下） {{i}}', en: 'Chat (bottom right) {{i}}' },
    cleanOtherIMDetail: {
      cn: '隐藏后您还可以在私信页面收发私信：鼠标指向右上角消息图标在下拉菜单中选择“私信”即可打开私信页面。' +
        (env.config.chatInPageSupported ? '配合“[[layout_chat_in_page]]”使用时只隐藏在新标签页打开聊天页面的按钮。' : ''),
    },
    cleanOtherIMNews: { cn: '热点提醒（右下）', tw: '熱點提醒（右下）', en: 'News, bottom right' },
    cleanOtherBackTop: { cn: '返回顶部', tw: '返回頂部', en: 'Back to Top' },
    cleanOtherTip: { cn: '功能提示框 {{i}}', tw: '功能提示框 {{i}}', en: 'Function Tips {{i}}' },
    cleanOtherTipDetail: {
      cn: '偶尔会出现的新功能推荐的弹框，如果隐藏了对应功能的界面可能弹框会显示到奇怪的地方。',
    },
    cleanOtherRelatedFeeds: { cn: '相关微博推荐 {{i}}', tw: '相關微博推薦 {{i}}', en: 'Related Weibo {{i}}' },
    cleanOtherRelatedFeedsDetail: {
      cn: '在单条微博页面可以看到的相关微博推荐',
    },
    cleanOtherRelatedVideo: { cn: '相关视频推荐', tw: '相關視頻推薦', en: 'Related Videos' },
    cleanOtherRelatedArticle: { cn: '头条文章页推荐阅读', tw: '頭條文章頁推薦閱讀', en: 'Suggested Article' },
    cleanOtherSendWeibo: { cn: '首页外的微博发布框 {{i}}', tw: '首頁外的微博發佈框 {{i}}', en: 'All other Weibo publishers {{i}}' },
    cleanOtherSendWeiboDetail: {
      cn: '除了首页的微博发布框，右上角按钮弹出的快速发布框外；其他的各种发布框。如微博文章下方转发用的发布框等。',
    },
  });

  clean.CleanGroup('other', () => i18n.cleanOtherGroupTitle);
  clean.CleanRule('ads', () => i18n.cleanOtherAds, 1, {
    weiboVersion: [6, 7],
    init: function () {
      if (yawf.WEIBO_VERSION === 6) {
        if (env.config.requestBlockingSupported) {
          backend.onRequest('ads', details => {
            if (this.isEnabled()) return { cancel: true };
            return {};
          });
        }
      }
    },
    ainit: function () {
      if (yawf.WEIBO_VERSION === 6) {
        util.css.append([
          '[ad-data]', '[feedtype="ad"]',
          '[id^="ads_"]', '[id^="ad_"]',
          '[id*="pl_rightmod_ads"]', '[id*="pl_content_biz"]', '[id*="pl_ad_"]', '[id^="sinaadToolkitBox"]',
          '[class*="WB_ad_"]',
          '#topicAD', '#topicADButtom', '.WB_feed .popular_buss', '.feed_app_ads', '.W_bigDay',
          '.WB_feed_yy2016_up_but', '.WB_feed_yy2016_down_but', '#pl_common_ali',
          '.W_skin_banner',
          '[node-type="imgBtn"][action-data="canUploadImage=0"]',
        ].join(',') + ' { display: none !important; } ' +
          '#wrapAD, .news_logo { visibility: hidden !important; }');

        let version = '';
        // 检查应当替换为哪种皮肤
        // 网页中 $CONFIG.skin 给出了用户选择的皮肤
        const defaultSkin = 'skin058';
        let targetSkin = defaultSkin;
        try { targetSkin = init.page.$CONFIG.skin || defaultSkin; } catch (e) { targetSkin = defaultSkin; }
        if (/skin3[56]\d/.test(targetSkin)) targetSkin = defaultSkin;
        // 检查网页中是否被插入了广告皮肤，如果有则换成用户选择的（或默认的）皮肤
        const updateSkin = function updateSkin() {
          const adskin = document.querySelector('link[href*="/skin35"], link[href*="/skin36"]');
          if (adskin) {
            version = new URL(adskin.href).searchParams.get('version');
            util.debug('ad skin %o(version %o) has been replaced', adskin.href, version);
            adskin.setAttribute('href', `//img.t.sinajs.cn/t6/skin/${targetSkin}/skin.css?version=${encodeURIComponent(version)}`);
          }
          const adskincover = document.querySelector('#skin_cover_s[style*="/skin35"], #skin_cover_s[style*="/skin36"]');
          if (adskincover) adskincover.style.backgroundImage = `url("//img.t.sinajs.cn/t6/skin/${targetSkin}/images/profile_cover_s.jpg?version=${encodeURIComponent(version)}")`;
        };
        observer.dom.add(updateSkin);

        // 一些广告内容的 iframe，如果这些东西只是隐藏没有被摘掉的话，里面的 JavaScript 会不停的报错，直到把你的控制台弄崩
        const removeAdIframes = function removeAdIframes() {
          const iframes = Array.from(document.querySelectorAll('iframe[src*="s.alitui.weibo.com"]'));
          iframes.forEach(function (iframe) {
            iframe.parentNode.removeChild(iframe);
          });
        };
        observer.dom.add(removeAdIframes);

        // 视频播放完毕之后会自动推荐下一个视频，之前很多是相关推荐，但现在也有不少是广告，所以不单独做一个选项，直接放在这里了
        observer.dom.add(function videoNoAutoNext() {
          const close = document.querySelector('.video_box_next [action-type="next_close"]:not([yawf-no-auto-next])');
          if (!close) return;
          close.setAttribute('yawf-no-auto-next', '');
          close.click();
        });
      } else {
        util.inject(function (rootKey) {
          const yawf = window[rootKey];
          const vueSetup = yawf.vueSetup;
          vueSetup.eachComponentVM('card-hot-search', function (vm) {
            vm.$watch(function () { return this.bandList; }, function () {
              const cleanUp = vm.bandList.filter(i => !i.is_ad);
              if (vm.bandList.length !== cleanUp.length) vm.bandList = cleanUp;
            });
            vm.$watch(function () { return this.TopWord; }, function () {
              if (vm.TopWord?.is_ad) vm.TopWord = null;
            });
          }, { immediate: true });

          vueSetup.eachComponentVM('new-hot', function (vm) {
            vm.$watch(function () { return this.list; }, function () {
              const list = vm.list;
              if (Array.isArray(list) && list.some(item => item.realpos)) {
                for (let i = 0; i < list.length;) {
                  if (!list[i].realpos) {
                    list.splice(i, 1);
                  } else i++;
                }
              }
              vm.hasTop = false;
            });
          });

          vueSetup.transformComponentsRenderByTagName('tips-ad', function () {
            return function () { return null; };
          }, { raw: true });
        }, util.inject.rootKey);
      }
    },
  });
  if (env.config.requestBlockingSupported) {
    clean.CleanRule('tracker', () => i18n.cleanOtherTracker, 1, {
      init: function () {
        backend.onRequest('tracker', details => {
          if (this.isEnabled()) return { cancel: true };
          return {};
        });
      },
    });
  }
  clean.CleanRule('music', () => i18n.cleanOtherMusic, 1, '.PCD_mplayer { display: none !important; }');
  clean.CleanRule('template', () => i18n.cleanOtherTemplate, 1, '.icon_setskin { display: none !important; }');
  clean.CleanRule('home_tip', () => i18n.cleanOtherHomeTip, 1, '#v6_pl_content_hometip { display: none !important }');
  clean.CleanRule('footer', () => i18n.cleanOtherFooter, 1, {
    // 直接 display: none 的话，发现页面的左边栏会飘走
    acss: '.global_footer, .WB_footer { height: 0; overflow: hidden; } [yawf-component-tag*="copy-right"] { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanOtherFooterDetail } },
    weiboVersion: [6, 7],
  });
  clean.CleanRule('im', () => i18n.cleanOtherIM, 1, {
    acss: '.WB_webim { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanOtherIMDetail } },
  });
  clean.CleanRule('im_news', () => i18n.cleanOtherIMNews, 1, '.webim_news { display: none !important; }');
  clean.CleanRule('back_top', () => i18n.cleanOtherBackTop, 1, '.W_gotop { display: none !important; }');
  clean.CleanRule('tip', () => i18n.cleanOtherTip, 1, {
    acss: '.W_layer_tips { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanOtherTipDetail } },
  });
  clean.CleanRule('related_feeds', () => i18n.cleanOtherRelatedFeeds, 1, {
    acss: '[yawf-obj-name="相关推荐"] { display: none !important; } #WB_webim .wbim_chat_box, #WB_webim .wbim_min_chat  { right: 20px !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanOtherRelatedFeedsDetail } },
  });
  clean.CleanRule('related_video', () => i18n.cleanOtherRelatedVideo, 1, '.video_box_more { display: none !important; }');
  clean.CleanRule('related_article', () => i18n.cleanOtherRelatedArticle, 1, '.WB_artical [node-type="recommend"] { display: none !important; }');
  clean.CleanRule('send_weibo', () => i18n.cleanOtherSendWeibo, 1, {
    acss: '.send_weibo_simple { display: none !important; }',
    ref: { i: { type: 'bubble', icon: 'warn', template: () => i18n.cleanOtherSendWeiboDetail } },
  });

}());
