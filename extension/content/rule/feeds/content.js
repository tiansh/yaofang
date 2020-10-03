; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const config = yawf.config;
  const observer = yawf.observer;
  const request = yawf.request;
  const feedParser = yawf.feed;
  const network = yawf.network;

  const feeds = yawf.rules.feeds;
  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;
  const ui = util.ui;
  const strings = util.strings;

  const content = feeds.content = {};

  i18n.feedContentGroupTitle = {
    cn: '内容',
    tw: '內容',
    en: 'Content',
  };

  content.content = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedContentGroupTitle,
  });

  i18n.styleTextFontSize = {
    cn: '增大微博正文字号为|原大小的{{ratio}}（V7最大200%）',
    tw: '加大微博內文字體為|原大小的{{ratio}}（V7最大200%）',
    en: 'Increase font size for weibo content | to {{ratio}} (V7 up to 200%)',
  };

  content.fontSize = rule.Rule({
    weiboVersion: [6, 7],
    id: 'feed_font_size',
    version: 1,
    parent: content.content,
    template: () => i18n.styleTextFontSize,
    ref: {
      ratio: {
        type: 'select',
        select: [
          { value: '120', text: '120%', style: `font-size: 16px;` },
          { value: '150', text: '150%', style: `font-size: 21px;` },
          { value: '200', text: '200%', style: `font-size: 28px;` },
          { value: '300', text: '300%', style: `font-size: 42px;` },
        ],
      },
    },
    ainit() {
      if (yawf.WEIBO_VERSION === 6) {
        const config = {
          120: { fs: 16, lh: 26, fs2: 14, lh2: 24, h: 20, h2: 18, fs3: 12 },
          150: { fs: 21, lh: 32, fs2: 18, lh2: 27, h: 25, h2: 23, fs3: 14 },
          200: { fs: 28, lh: 42, fs2: 24, lh2: 36, h: 33, h2: 29, fs3: 19 },
          300: { fs: 42, lh: 64, fs2: 36, lh2: 54, h: 50, h2: 46, fs3: 28 },
        }[this.ref.ratio.getConfig()];
        const { fs, lh, fs2, lh2, h, h2, fs3 } = config;
        css.append(`
.WB_info, .WB_text, .WB_info *, .WB_text * { font-size: ${fs}px !important; line-height: ${lh}px !important; }
.WB_feed_expand .WB_info *, .WB_feed_expand .WB_text *, .WB_feed_expand .WB_info, .WB_feed_expand .WB_text { font-size: ${fs2}px !important; line-height: ${lh2}px !important; }
.WB_text .W_btn_b { height: ${h}px !important; }
.WB_text .W_btn_b, .WB_text .W_btn_b * { line-height: ${h}px !important; font-size: ${fs2}px !important; }
.WB_feed_expand .WB_text .W_btn_b, .WB_text .W_btn_c, .WB_empty .W_btn_c { height: ${h2}px !important; line-height: ${h2}px !important; }
.WB_feed_expand .WB_text .W_btn_b, .WB_feed_expand .WB_text .W_btn_b *, .WB_text .W_btn_c *, .WB_empty .W_btn_c * { line-height: ${h2}px !important; font-size: ${fs3}px !important; }
.W_icon_feedpin, .W_icon_feedhot { height: 16px !important; line-height: 16px !important; }
.WB_info { margin-bottom: 2px !important; padding-top: 0 !important; line-height: ${fs <= 28 ? 28 : 50}px !important; }
.yawf-WB_text_size_main, .yawf-WB_text_size { font-size: ${fs}px; line-height: ${lh}px; }
.yawf-WB_text_size_expand, .WB_feed_expand .yawf-WB_text_size { font-size: ${fs2}px; }
`);
      } else {
        const config = {
          120: { fs: 16, alh: 20, lh: 26, fs2: 14, lh2: 24 },
          150: { fs: 21, alh: 24, lh: 32, fs2: 18, lh2: 27 },
          200: { fs: 28, alh: 32, lh: 42, fs2: 24, lh2: 36 },
          300: { fs: 28, alh: 32, lh: 42, fs2: 24, lh2: 36 },
        }[this.ref.ratio.getConfig()];
        const { fs, lh, fs2, lh2 } = config;
        css.append(`
.yawf-feed-author-line { margin-bottom: 0px !important; font-size: ${fs}px !important; line-height: ${lh}px !important; }
.yawf-feed-author-box { justify-content: space-between !important; }
.yawf-feed-author-box::after { content: " "; margin-bottom: 4px }
.yawf-feed-detail-content { font-size: ${fs}px !important; line-height: ${lh}px !important; }
.yawf-feed-original span, .yawf-feed-detail-content-retweet, .yawf-feed-comment-text, .yawf-feed-comment-more, .yawf-feed-repost-text { font-size: ${fs2}px !important; line-height: ${lh2}px !important; }
.yawf-feed-detail-content img, .yawf-feed-detail-content .icon-link { height: ${fs}px !important; width: ${fs}px !important; }
.yawf-feed-detail-content-retweet img, .yawf-feed-detail-content-retweet .icon-link { height: ${fs2}px !important; width: ${fs2}px !important; }

.wbpv-big-play-button { z-index: 99; }
`);
      }
    },
  });

  i18n.autoExpandLongFeeds = {
    cn: '自动展开|不超过{{count}}字的微博|（每个换行符计{{br}}字）',
    tw: '自動展開|不超過{{count}}個字的微博|（每個換行符計{{br}}字）',
    en: 'Automatically unfold weibo | within {{count}} characters || (count each line break as {{br}} characters)',
  };

  content.expandLong = rule.Rule({
    weiboVersion: [6, 7],
    id: 'feed_long_expand',
    version: 1,
    parent: content.content,
    template: () => i18n.autoExpandLongFeeds,
    ref: {
      count: { type: 'range', min: 140, max: 2000, step: 10, initial: 200 },
      br: { type: 'range', min: 1, max: 60, step: 1, initial: 30 },
    },
    // V6 这个设置项的相关逻辑实现在 content/rule/filter/common/long.js
    // V7 实现如下
    init() {
      const expand = this.isEnabled();
      const count = this.ref.count.getConfig();
      const br = this.ref.br.getConfig();
      util.inject(function (rootKey, expand, { count, br }) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        const expandLongTextContent = function (vm) {
          vm.$set(vm.data, 'text_expand', vm.showText);
          vm.$http = Object.create(vm.$http);
          vm.$http.get = (function (get) {
            return async function (...args) {
              if (args[0] === '/ajax/statuses/longtext' && vm.data.longTextContent_raw) {
                return {
                  data: {
                    ok: 1,
                    http_code: 200,
                    data: {
                      longTextContent: vm.data.longTextContent_raw,
                      url_struct: vm.data.url_struct || [],
                      topic_struct: vm.data.topic_struct || [],
                    },
                  },
                };
              } else {
                return get.call(this, ...args);
              }
            };
          }(vm.$http.get));
          const text = vm.data.longTextContent_raw;
          if (!text) return;
          const len = Math.ceil(text.length - (text.match(/[\u0020-\u00fe]/g) || []).length / 2);
          const remLen = len + (text.split('\n').length - 1) * (br - 1);
          if (expand && remLen < count) {
            vm.handleExpand();
            const unwatch = vm.$watch(function () { return this.data.longTextContent; }, function () {
              if (!vm.data.longTextContent) return;
              unwatch();
              vm.showText = vm.data.longTextContent;
              vm.$emit('updateText', vm.showText);
            });
          } else {
            const expand = '<span class="expand">展开</span>';
            const wordTip = `展开（约 ${Math.ceil(len / 10) * 10} 字）`;
            vm.data.text_expand = vm.data.text_expand.replace(expand, () => expand.replace('展开', wordTip));
            vm.showText = vm.data.text_expand;
            vm.$emit('updateText', vm.showText);
          }
        };

        vueSetup.eachComponentVM('feed-detail', function (vm) {
          const needLoadLong = function () {
            if (!this.isLongText) return false;
            if (this.data._yawf_LongTextContentLoading !== false) return false;
            if (this.data.longTextContent) return false;
            if (this.data._yawf_LongTextContentAutoExpand) return false;
            return this.data.mid;
          };
          vm.$watch(needLoadLong, function () {
            if (!needLoadLong.call(vm)) return;
            vm.$set(vm.data, '_yawf_LongTextContentAutoExpand', true);
            try {
              expandLongTextContent(vm);
            } catch (e) {
              console.error(e);
            }
          }, { immediate: true });
        });

      }, util.inject.rootKey, expand, { count, br });
    },
  });

  i18n.feedContentLineBreak = {
    cn: '将微博中的换行显示为|{{text}}',
    tw: '將微博中的換行顯示為|{{text}}',
    en: 'Show line breaks as character |  {{text}}',
  };

  content.feedContentLineBreak = rule.Rule({
    id: 'feed_content_line_break',
    version: 1,
    parent: content.content,
    template: () => i18n.feedContentLineBreak,
    ref: {
      text: {
        type: 'select',
        initial: '⏎',
        select: [
          { value: ' ', text: ' ' },
          { value: '⤶', text: '⤶' },
          { value: '↵', text: '↵' },
          { value: '⏎', text: '⏎' },
          { value: '↲', text: '↲' },
          { value: '↩', text: '↩' },
        ],
      },
    },
    ainit() {
      observer.dom.add(function feedContentLineBreak() {
        const brList = Array.from(document.querySelectorAll('.WB_text br'));
        brList.forEach(br => {
          const placeholder = document.createElement('span');
          placeholder.className = 'yawf-linebreak S_txt2';
          br.replaceWith(placeholder);
        });
      });
      const text = this.ref.text.getConfig();
      util.css.add('.yawf-linebreak::before { content: "' + text + '" }');
    },
  });

  i18n.showLinkUrl = {
    cn: '将微博中的网页链接替换为短网址',
    tw: '將微博中的网页链接替換為短網址',
    en: 'Replace 网页链接 in Weibo by shortened URL',
  };

  content.showLinkUrl = rule.Rule({
    id: 'feed_link_use_url',
    version: 1,
    parent: content.content,
    template: () => i18n.showLinkUrl,
    init() {
      const config = this.getConfig();
      const showLinkUrl = function showLinkUrl() {
        const icon = Array.from(document.querySelectorAll('.WB_feed_type a:not([yawf-link-type]) > .W_ficon:first-child'));
        icon.forEach(i => { i.parentNode.setAttribute('yawf-link-type', i.textContent.trim()); });
        if (!config) return;
        const links = Array.from(document.querySelectorAll('.WB_feed_type a[yawf-link-type="O"][title="网页链接"]:not([yawf-link-expand])'));
        links.forEach(link => {
          link.setAttribute('yawf-link-expand', '');
          link.textContent = link.href;
          link.className = 'yawf-link';
        });
      };
      observer.dom.add(showLinkUrl);
    },
  });

  i18n.useTextEmoji = {
    cn: '将微博中图片表示的 Unicode 表情符号替换为文本',
    tw: '將微博中圖片表示的 Unicode Emoji 替換為文本',
    en: 'Use text for unicode emoji instead of image',
  };

  const softbankEmojiLookupTable = { 1: 128102, 2: 128103, 3: 128139, 4: 128104, 5: 128105, 6: 128085, 7: 128094, 8: 128247, 9: 9742, 10: 128241, 11: 128224, 12: 128187, 13: 128074, 14: 128077, 15: 9757, 16: 9994, 17: 9996, 18: 128587, 19: 127935, 20: 9971, 21: 127934, 22: 9918, 23: 127940, 24: 9917, 25: 128033, 26: 128052, 27: 128663, 28: 9973, 29: 9992, 30: 128643, 31: 128645, 32: 10067, 33: 10071, 34: 10084, 35: 128148, 36: 128336, 37: 128337, 38: 128338, 39: 128339, 40: 128340, 41: 128341, 42: 128342, 43: 128343, 44: 128344, 45: 128345, 46: 128346, 47: 128347, 48: 127800, 49: 128305, 50: 127801, 51: 127876, 52: 128141, 53: 128142, 54: 127968, 55: 9962, 56: 127970, 57: 128649, 58: 9981, 59: 128507, 60: 127908, 61: 127909, 62: 127925, 63: 128273, 64: 127927, 65: 127928, 66: 127930, 67: 127860, 68: 127864, 69: 9749, 70: 127856, 71: 127866, 72: 9924, 73: 9729, 74: 9728, 75: 9748, 76: 127764, 77: 127748, 78: 128124, 79: 128049, 80: 128047, 81: 128059, 82: 128041, 83: 128045, 84: 128051, 85: 128039, 86: 128523, 87: 128515, 88: 128542, 89: 128544, 90: 128169, 257: 128234, 258: 128238, 259: 9993, 260: 128242, 261: 128540, 262: 128525, 263: 128561, 264: 128531, 265: 128053, 266: 128025, 267: 128055, 268: 128125, 269: 128640, 270: 128081, 271: 128161, 272: 127808, 273: 128143, 274: 127873, 275: 128299, 276: 128269, 277: 127939, 278: 128296, 279: 127878, 280: 127809, 281: 127810, 282: 128127, 283: 128123, 284: 128128, 285: 128293, 286: 128188, 287: 128186, 288: 127828, 289: 9970, 290: 9978, 291: 9832, 292: 127905, 293: 127915, 294: 128191, 295: 128192, 296: 128251, 297: 128252, 298: 128250, 299: 128126, 300: 12349, 301: 126980, 302: 127386, 303: 128176, 304: 127919, 305: 127942, 306: 127937, 307: 127920, 308: 128014, 309: 128676, 310: 128690, 311: 128679, 312: 128697, 313: 128698, 314: 128700, 315: 128137, 316: 128164, 317: 9889, 318: 128096, 319: 128704, 320: 128701, 321: 128266, 322: 128226, 323: 127884, 324: 128274, 325: 128275, 326: 127750, 327: 127859, 328: 128211, 329: 128177, 330: 128185, 331: 128225, 332: 128170, 333: 127974, 334: 128677, 335: 127359, 336: 128655, 337: 128699, 338: 128110, 339: 127971, 340: 127975, 341: 127973, 342: 127978, 343: 127979, 344: 127976, 345: 128652, 346: 128661, 1091: 127744, 1084: 127746, 1099: 127747, 1097: 127749, 1098: 127751, 1100: 127752, 1086: 127754, 821: 127775, 575: 9800, 576: 9801, 577: 9802, 578: 9803, 579: 9804, 580: 9805, 581: 9806, 582: 9807, 583: 9808, 584: 9809, 585: 9810, 586: 9811, 587: 9934, 772: 127799, 1095: 127811, 771: 127802, 773: 127803, 775: 127796, 776: 127797, 1092: 127806, 837: 127822, 838: 127818, 839: 127827, 840: 127817, 841: 127813, 842: 127814, 1049: 128064, 1051: 128066, 1050: 128067, 1052: 128068, 1033: 128069, 796: 128132, 797: 128133, 798: 128134, 799: 128135, 800: 128136, 1064: 128107, 1065: 128111, 1301: 128113, 1302: 128114, 1303: 128115, 1304: 128116, 1305: 128117, 1306: 128118, 1307: 128119, 1308: 128120, 595: 128129, 1310: 128130, 1311: 128131, 1325: 128013, 1326: 128020, 1327: 128023, 1328: 128043, 1318: 128024, 1319: 128040, 1320: 128018, 1321: 128017, 1089: 128026, 1317: 128027, 1314: 128032, 1315: 128036, 1313: 128038, 1312: 128044, 1316: 128057, 1322: 128058, 1323: 128046, 1324: 128048, 1329: 128056, 1334: 128062, 1027: 128553, 1040: 128562, 1030: 128565, 1039: 128560, 1038: 128530, 1028: 128548, 1048: 128536, 1047: 128538, 1036: 128567, 1037: 128563, 1045: 128517, 1034: 128518, 1042: 128514, 1044: 9786, 1043: 128546, 1041: 128557, 1035: 128552, 1046: 128545, 1031: 128534, 1032: 128554, 1026: 128527, 1025: 128549, 1029: 128521, 1059: 128581, 1060: 128582, 1062: 128583, 1063: 128588, 1053: 128591, 1281: 127977, 1284: 127980, 1285: 127983, 1286: 127984, 1288: 127981, 514: 9875, 779: 127982, 1289: 128508, 1309: 128509, 794: 128097, 795: 128098, 770: 128084, 792: 128082, 793: 128087, 801: 128088, 802: 128089, 803: 128092, 1299: [127464, 127475], 1294: [127465, 127466], 1297: [127466, 127480], 1293: [127467, 127479], 1296: [127468, 127463], 1295: [127470, 127481], 1291: [127471, 127477], 1300: [127472, 127479], 1298: [127479, 127482], 1292: [127482, 127480], 574: 128302, 521: 128304, 783: 128138, 1330: 127344, 1331: 127345, 1332: 127374, 1333: 127358, 788: 127872, 843: 127874, 1096: 127877, 784: 127880, 786: 127881, 1078: 127885, 1080: 127886, 1081: 127891, 1082: 127890, 1083: 127887, 1088: 127879, 1090: 127888, 1093: 127875, 1094: 127889, 769: 128221, 791: 128227, 790: 128189, 787: 9986, 1066: 127936, 1067: 127944, 1069: 127946, 1076: 128647, 1077: 128644, 1070: 128665, 1071: 128666, 1072: 128658, 1073: 128657, 1074: 128659, 1075: 127906, 1287: 127910, 778: 127911, 1282: 127912, 1283: 127913, 804: 127916, 1068: 127921, 806: 127926, 774: 128144, 1061: 128145, 1085: 128146, 519: 128286, 590: 169, 591: 174, 1335: 8482, 528: [35, 8419], 540: [49, 8419], 541: [50, 8419], 542: [51, 8419], 543: [52, 8419], 544: [53, 8419], 545: [54, 8419], 546: [55, 8419], 547: [56, 8419], 548: [57, 8419], 549: [48, 8419], 523: 128246, 592: 128243, 593: 128244, 834: 127833, 832: 127836, 825: 127838, 826: 127846, 827: 127839, 828: 127841, 829: 127832, 830: 127834, 831: 127837, 833: 127835, 835: 127842, 836: 127843, 844: 127857, 845: 127858, 1087: 127847, 824: 127861, 780: 127867, 566: 8599, 568: 8600, 567: 8598, 569: 8601, 562: 11014, 563: 11015, 564: 10145, 565: 11013, 570: 9654, 571: 9664, 572: 9193, 573: 9194, 818: 11093, 819: 10060, 822: 10068, 823: 10069, 529: 10175, 807: 128147, 808: 128151, 809: 128152, 810: 128153, 811: 128154, 812: 128155, 813: 128156, 1079: 128157, 516: 128159, 524: 9829, 526: 9824, 525: 9830, 527: 9827, 782: 128684, 520: 128685, 522: 9855, 594: 9888, 513: 128694, 777: 128702, 532: 127378, 553: 127380, 530: 127381, 589: 127383, 531: 127385, 515: 127489, 552: 127490, 555: 127539, 554: 127541, 533: 127542, 534: 127514, 535: 127543, 536: 127544, 551: 127545, 556: 127535, 557: 127546, 789: 12953, 781: 12951, 550: 127568, 820: 128162, 785: 128163, 817: 128166, 816: 128168, 814: 10024, 517: 10036, 518: 10035, 537: 9898, 538: 128309, 539: 128307, 815: 11088, 805: 128276, 588: 128285, 558: 128070, 559: 128071, 560: 128072, 561: 128073, 1054: 128075, 1055: 128079, 1056: 128076, 1057: 128078, 1058: 128080 };
  const emojiCodeToUtf8 = function (code) {
    // 我们将 utf8 编码转换成码位点，并减去 0xe000 后查表
    const softbankEmojiString = decodeURIComponent(code.replace(/(..)/g, '%$1'));
    const unicodeCodePoints = softbankEmojiLookupTable[softbankEmojiString.codePointAt(0) - 0xe000];
    const codePointsArray = typeof unicodeCodePoints === 'number' ? [unicodeCodePoints] : unicodeCodePoints;
    const unicodeText = String.fromCodePoint(...codePointsArray);
    return unicodeText;
  };

  content.useTextEmoji = rule.Rule({
    id: 'feed_unicode_emoji',
    version: 1,
    parent: content.content,
    template: () => i18n.useTextEmoji,
    ainit() {
      const useTextEmoji = function useTextEmoji() {
        const emoji = Array.from(document.querySelectorAll('[src*="//img.t.sinajs.cn/t4/appstyle/expression/emimage/e"]'));
        emoji.forEach(img => {
          const code = img.getAttribute('src').match(/(e.....)\.png/)[1];
          const text = emojiCodeToUtf8(code);
          const emojiContainer = document.createElement('span');
          emojiContainer.className = 'yawf-emoji';
          emojiContainer.textContent = text;
          img.replaceWith(emojiContainer);
        });
      };
      observer.dom.add(useTextEmoji);
    },
  });

  Object.assign(i18n, {
    showVoteResult: {
      cn: '未参与的投票显示得票数{{i}}',
      tw: '未參與的投票展示得票數{{i}}',
      en: 'Show voting results in without voting needed {{i}}',
    },
    showVoteResultDetail: {
      cn: '由于微博投票会自动点赞对应微博，开启该功能后，扩展会在您没有手动点赞前阻止您参与投票。无论是否开启本功能，微博投票都会导致您自动点赞该微博。',
      tw: '由於微博投票會自動點贊對應微博，開啟該功能後，擴充套件會在您沒有手動點贊前阻止您參與投票。無論是否開啟本功能，微博投票都會導致您自動點贊該微博。',
      en: 'Voting will automatically mark the feed liked. Extension will block your voting when you vote without mark the feed liked manually. Voting will automatically like the feed regardless whether this option is enabled or not.',
    },
    voteTitle: {
      cn: '参与投票',
      tw: '參與投票',
      en: 'Voting',
    },
    voteText: {
      cn: '如需参与投票请先点赞微博。',
      tw: '如需參與投票請先點贊微博。',
      en: 'You have to like the feed first before voting.',
    },
  });

  content.showVoteResult = rule.Rule({
    weiboVersion: [6, 7],
    id: 'show_vote_result',
    version: 46,
    parent: content.content,
    template: () => i18n.showVoteResult,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.showVoteResultDetail },
    },
    ainit() {
      if (yawf.WEIBO_VERSION === 6) {
        const updateVoteByLike = function (feedlike) {
          const like = feedlike.querySelector('[action-type="fl_like"]');
          const liked = like.querySelector('[node-type="like_status"]').matches('.UI_ani_praised');
          const items = feedlike.querySelectorAll('[action-type="feed_list_vote"], [action-type="yawf-feed_list_vote"]');
          Array.from(items).forEach(item => {
            item.setAttribute('action-type', liked ? 'feed_list_vote' : 'yawf-feed_list_vote');
          });
        };
        const showVoteResult = async function (vote) {
          const voteButtons = Array.from(vote.querySelectorAll('[action-type="feed_list_vote"], [action-type="yawf-feed_list_vote"]'));
          if (!voteButtons.length) return;
          const voteId = new URLSearchParams(voteButtons[0].getAttribute('action-data')).get('vote_id');
          if (!voteId) return;
          const voteResult = await request.voteDetail(voteId);
          voteButtons.forEach(button => {
            const actionData = new URLSearchParams(button.getAttribute('action-data'));
            const id = actionData.get('vote_items');
            const item = voteResult.vote_info.option_list.find(item => item.id === id);
            button.dataset.partNum = item.part_num.replace('票', '人');
            button.dataset.partRatio = item.part_ratio;
            button.style.setProperty('--part-ratio', item.part_ratio / 100);
          });
          const feedlike = vote.closest('.WB_feed_expand, .WB_feed_type');
          updateVoteByLike(feedlike);
        };
        const watchLike = function (/** @type {HTMLElement} */vote) {
          const feedlike = vote.closest('.WB_feed_expand, .WB_feed_type');
          const like = feedlike.querySelector('[action-type="fl_like"]');
          const observer = new MutationObserver(() => { updateVoteByLike(feedlike); });
          observer.observe(like, { subtree: true, attributes: true, attributeFilter: ['class'] });
          updateVoteByLike(feedlike);
        };
        observer.dom.add(function updateVoteResult() {
          const voteList = document.querySelectorAll('.WB_card_vote:not([yawf-card-vote])');
          if (!voteList.length) return;
          Array.from(voteList).forEach(vote => {
            vote.setAttribute('yawf-card-vote', 'yawf-card-vote');
            showVoteResult(vote);
            watchLike(vote);
          });
        });
        document.addEventListener('click', event => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          const vote = target.closest('[action-type="yawf-feed_list_vote"]');
          if (!vote) return;
          ui.alert({
            id: 'yawf-vote-block',
            icon: 'warn',
            title: i18n.voteTitle,
            text: i18n.voteText,
          });
        });
        css.append(`
.WB_card_vote.WB_card_vote .vote_con1 .item { position: relative; z-index: 1; overflow: hidden; text-align: left; }
.WB_card_vote.WB_card_vote .vote_con1 .item::after { content: attr(data-part-num) ; float: right; }
.WB_card_vote.WB_card_vote .vote_con1 .item::before { content: " "; width: calc(var(--part-ratio) * 100%); top: 0; left: 0; bottom: 0; margin: 0; position: absolute; z-index: -1; }
.WB_card_vote.WB_card_vote .vote_con2 .vote_btn { position: relative; font-size: 14px; }
.WB_card_vote.WB_card_vote .vote_con2 .vote_btn a { background: currentColor; border-radius: 0; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fl .vote_btn a { margin-right: -2px; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fr .vote_btn a { margin-left: -2px; }
.WB_card_vote.WB_card_vote .vote_con2 .vote_btn::after { content: attr(data-part-num); position: absolute; top: 0; bottom: 0; color: white; line-height: 24px; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fl .vote_btn::after { left: 26px; right: auto; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fr .vote_btn::after { left: auto; right: 26px; }
.WB_card_vote.WB_card_vote .vote_con1 .item_rt.S_txt1 .bg,
.WB_card_vote.WB_card_vote .vote_con1 .item::before { background-color: #80808022; }
`);
        const smallImage = feeds.layout.smallImage;
        if (smallImage.isEnabled()) {
          css.append(`
.WB_card_vote.WB_card_vote .vote_con2 .W_fl .vote_btn a { margin-right: -1px; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fr .vote_btn a { margin-left: -1px; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fl .vote_btn::after { left: 10px; }
.WB_card_vote.WB_card_vote .vote_con2 .W_fr .vote_btn::after { right: 10px; }
`);
        }
      } else {
        const voteBlock = function () {
          ui.alert({
            id: 'yawf-vote-block',
            icon: 'warn',
            title: i18n.voteTitle,
            text: i18n.voteText,
          });
        };

        util.inject(function (rootKey, voteBlock) {
          const yawf = window[rootKey];
          const vueSetup = yawf.vueSetup;

          vueSetup.eachComponentVM('feed-card-vote', function (vm) {

            debugger;
            vueSetup.transformComponentRender(vm, function (render) {
              return function (createElement, { builder }) {
                if (this.voteObject.parted) {
                  return render.call(this, createElement);
                }
                debugger;
                const wrap = Object.create(this, {
                  isParted: { value: true },
                  firstParted: { value: true },
                  voteObject: {
                    value: Object.create(this.voteObject, {
                      parted: { value: 1 },
                    }),
                  },
                });
                this.constructor.options.methods
                // getAniStyle: { value: this.constructor.options.methods.getAniStyle },
                wrap.getAniStyle = wrap.getAniStyle.bind(wrap);
                this.cancelVote = function () {

                };
                const { nodeStruct, Nodes, getRoot } = builder(render.call(wrap, createElement));
                const { removeChild } = Nodes;
                const share = nodeStruct.querySelector(`[class|="${this.$style.btnB}"]`);
                removeChild(share.parentNode, share);
                return getRoot();
              };
            }, { raw: true });

            vm.$forceUpdate();
          });
        }, util.inject.rootKey, voteBlock);

      }
    },
  });

  i18n.customizeSource = {
    cn: '自定义来源微博仅显示“来自微博 weibo.com”',
    tw: '自訂來源微博僅顯示「來自微博 weibo.com」',
    en: 'Weibo with customize source show "come from 微博 weibo.com" only',
  };

  content.customizeSource = rule.Rule({
    id: 'feed_no_custom_source',
    version: 1,
    parent: content.content,
    template: () => i18n.customizeSource,
    ainit() {
      const customizeSource = function customizeSource() {
        const sources = Array.from(document.querySelectorAll('.WB_from:not([yawf-custom-source])'));
        const items = [];
        sources.forEach(from => {
          from.setAttribute('yawf-custom-source', 'yawf-custom-source');
          if (from.matches('.list_li[mid] *')) return;
          if (/未通过审核应用/.test(from.textContent)) return;
          // 自定义微博来源可以不显示来源
          if (from.querySelector('[node-type="feed_list_item_date"]:only-child')) {
            items.push(from.appendChild(document.createElement('div')));
            return;
          }
          // 也可以显示自定义的来源
          const item = from.querySelector('a[href*="vip.weibo.com"]');
          if (item) items.push(item);
        });
        items.forEach(from => {
          const container = document.createElement('div');
          container.innerHTML = '<a rel="nofollow" href="//weibo.com/" target="_blank" action-type="app_source" class="S_txt2">微博 weibo.com</a>';
          from.replaceWith(container.firstChild);
        });
      };
      observer.dom.add(customizeSource);
    },
  });

  Object.assign(i18n, {
    viewEditInfo: {
      cn: '点击“已编辑”字样查看编辑历史',
      tw: '點擊「已編輯」字樣查閱編輯歷史',
      en: 'View edit history by clicking "Edited"',
    },
    viewEditInfoDetail: {
      cn: '查看编辑历史的弹框和原版不同，点击微博右上角菜单看到的微博编辑记录仍是原版。点左侧列表可以查看指定的版本，点右侧列表可以和当前显示的版本对比。',
    },
    viewEditInfoEdited: {
      cn: '已编辑',
      tw: '已編輯',
      en: 'Edited',
    },
    viewEditTitle: {
      cn: '微博编辑记录',
      tw: '微博編輯記錄',
      en: 'Edit History',
    },
    selectFeedVersion: {
      cn: '选择版本以查看',
      tw: '选择版本以查阅',
      en: 'Select Version',
    },
    diffFeedVersion: {
      cn: '与选定版本比对',
      tw: '與選定版本比對',
      en: 'Compare With',
    },
    viewEditLoading: {
      cn: '正在加载编辑记录……',
      tw: '正在載入編輯記錄……',
      en: 'Loading edit history...',
    },
  });

  content.viewEditInfo = rule.Rule({
    id: 'view_edit_info',
    version: 44,
    parent: content.content,
    template: () => i18n.viewEditInfo,
    ref: {
      i: { type: 'bubble', icon: 'info', template: () => i18n.viewEditInfoDetail },
    },
    ainit() {
      const timeLocale = layout.details.timezone.isEnabled() ? 'current' : 'cst';
      /**
       * @param {string} sourceStr
       * @param {string} targetStr
       */
      const compare = function (sourceStr, targetStr) {
        const matchReg = /\n|\[.{1,8}\]|#(?=.{1,31}#)[^#\n]*#|http:\S+|[a-zA-Z-]+|\s|\S/ug;
        const source = sourceStr.trim().match(matchReg);
        const target = targetStr.trim().match(matchReg);
        const sl = source.length, tl = target.length;
        /** @type {number[][]} */
        const size = [...Array(sl)].map(_ => Array(tl));
        /** @type {[number, number][][]} */
        const from = [...Array(sl)].map(_ => Array(tl));
        for (let si = 0; si < sl; si++) {
          for (let ti = 0; ti < tl; ti++) {
            if (source[si] === target[ti]) {
              const d = si && ti ? size[si - 1][ti - 1] : 0;
              from[si][ti] = [si - 1, ti - 1];
              size[si][ti] = d + source[si].length;
            } else {
              const sd = si ? size[si - 1][ti] : 0;
              const td = ti ? size[si][ti - 1] : 0;
              if (sd > td) {
                from[si][ti] = [si - 1, ti];
                size[si][ti] = sd;
              } else {
                from[si][ti] = [si, ti - 1];
                size[si][ti] = td;
              }
            }
          }
        }
        /** @type {{ type: 'same'|'delete'|'insert', chars: string }[]} */
        const output = [];
        for (let si = sl - 1, ti = tl - 1; si >= 0 || ti >= 0;) {
          const [fs, ft] = si >= 0 && ti >= 0 ? from[si][ti] : [-1, -1];
          if (fs !== si && ft !== ti) {
            output.push({ type: 'same', chars: source.slice(fs + 1, si + 1) });
          } else if (fs !== si) {
            output.push({ type: 'delete', chars: source.slice(fs + 1, si + 1) });
          } else if (ft !== ti) {
            output.push({ type: 'insert', chars: target.slice(ft + 1, ti + 1) });
          }
          [si, ti] = [fs, ft];
        }
        /** @type {{ type: 'same'|'delete'|'insert', str: string }} */
        let last = { type: 'same', str: '' };
        const connected = [last, ...output.reverse().map(({ type, chars }) => {
          const str = chars.join('');
          if (type === last.type) {
            last.str += str;
            return null;
          }
          last = { type, str };
          return last;
        })].filter(content => content && content.str);
        /** @type {{ delete: { type: 'delete', str: string }, insert: { type: 'insert', str: string } }} */
        let prevPart = { delete: null, insert: null, same: null };
        const result = connected.filter(part => {
          const { str, type } = part;
          if (['delete', 'insert'].includes(type)) {
            if (prevPart[type]) {
              prevPart[type].str += str;
              return false;
            } else {
              prevPart[type] = part;
              return true;
            }
          } else {
            if (str.length < 4 && prevPart.delete && prevPart.insert) {
              prevPart.delete.str += str;
              prevPart.insert.str += str;
              return false;
            } else {
              prevPart.delete = prevPart.insert = null;
              return true;
            }
          }
        });
        return result;
      };
      const renderTextDiff = function (container, source, target) {
        const diff = compare(source, target);
        const fragement = document.createDocumentFragment();
        diff.forEach(function ({ type, str }) {
          str.split(/(\n)/g).forEach(part => {
            /** @type {'del'|'ins'|'span'} */
            const tagName = { delete: 'del', insert: 'ins', same: 'span' }[type];
            const span = document.createElement(tagName);
            span.classList.add('yawf-diff-' + type);
            span.textContent = part;
            fragement.appendChild(span);
            if (part === '\n') {
              const breakToken = document.createElement(tagName);
              breakToken.classList.add('yawf-diff-' + type);
              const breakChar = document.createElement('span');
              breakChar.classList.add('S_txt2', 'yawf-diff-line-break');
              breakToken.appendChild(breakChar);
              fragement.insertBefore(breakToken, span);
            }
          });
        });
        container.innerHTML = '';
        container.appendChild(fragement);
      };
      /**
       * @param {HTMLElement} text
       * @param {HTMLElement} source
       * @param {HTMLElement} target
       */
      const renderImageDiff = function (ref, source, target) {
        while (ref.nextSibling) ref.parentNode.removeChild(ref.nextSibling);
        /** @returns {string} */
        const getId = li => li.getAttribute('action-data');
        /** @returns {[HTMLElement, string, HTMLElement[], Set<string>]} */
        const getImages = function (dom) {
          const wrap = dom.querySelector('.WB_media_wrap');
          if (!wrap) return [null, '', [], new Set()];
          const container = wrap.cloneNode(true);
          container.classList.add('S_line1');
          const html = container.innerHTML;
          const items = Array.from(container.querySelectorAll('li'));
          const actionDatas = new Set(items.map(getId));
          return [container, html, items, actionDatas];
        };
        const renderImages = function (images) {
          ref.parentNode.appendChild(images);
        };
        const linkImage = function (container) {
          if (!container) return;
          const imgs = Array.from(container.querySelectorAll('img'));
          imgs.forEach(img => {
            const link = document.createElement('a');
            const src = new URL(img.src).href;
            link.href = ['https://', new URL(src).host, '/large', src.match(/\/([^/]*)$/g)].join('');
            link.target = '_blank';
            link.className = 'yawf-diff-image-link';
            link.appendChild(img.parentNode.replaceChild(link, img));
          });
        };
        const [sourceImg, sourceHtml, sourceItems, sourceActionDatas] = getImages(source);
        const [targetImg, targetHtml, targetItems, targetActionDatas] = getImages(target);
        linkImage(sourceImg);
        linkImage(targetImg);
        // 如果压根没有图片，就什么都不用做
        if (!sourceImg && !targetImg) return;
        // 如果图片没变，那么展示一份就行了
        if (sourceHtml === targetHtml) {
          renderImages(sourceImg);
          return;
        }
        // 标记修改
        const sourceFilteredItems = sourceItems.map(item => {
          if (targetActionDatas.has(getId(item))) return item;
          item.classList.add('yawf-img-delete');
          return null;
        }).filter(item => item);
        const targetFilteredItems = targetItems.map(item => {
          if (sourceActionDatas.has(getId(item))) return item;
          item.classList.add('yawf-img-insert');
          return null;
        }).filter(item => item);
        sourceFilteredItems.forEach((sourceItem, index) => {
          const targetItem = targetFilteredItems[index];
          if (getId(sourceItem) === getId(targetItem)) return;
          sourceItem.classList.add('yawf-img-reorder');
          targetItem.classList.add('yawf-img-reorder');
        });
        // 最后把他们显示出来
        if (sourceImg) renderImages(sourceImg);
        if (targetImg) renderImages(targetImg);
      };
      const renderDiff = function (container, version1, version2) {
        const [source, target] = [version1, version2].sort((v1, v2) => v1.index - v2.index);
        const text = container.querySelector('.WB_text');
        renderTextDiff(text, source.text, target.text);
        renderImageDiff(text, source.dom, target.dom);
      };
      const showContent = function (container, version, diff) {
        container.innerHTML = '';
        container.appendChild(version.dom.cloneNode(true));
        if (!diff || diff === version) return;
        renderDiff(container, version, diff);
      };
      const dialogRender = async function (container, feedHistoryPromise) {
        container.classList.add('yawf-feed-edit-dialog-content');
        container.innerHTML = `<div class="yawf-feed-edit-select S_bg1 S_line1"><div class="yawf-feed-edit-select-title S_line1"></div><ol class="yawf-feed-edit-list yawf-feed-edit-select-list S_line1"></ol></div><div class="yawf-feed-edit-view"><div class="yawf-feed-edit-view-content"><div class="yawf-feed-edit-loading"><div class="WB_empty"><div class="WB_innerwrap"><div class="empty_con clearfix"><p class="icon_bed"><i class="W_icon icon_warnB"></i></p><p class="text"></p></div></div></div></div></div></div><div class="yawf-feed-edit-diff S_bg1 S_line1"><div class="yawf-feed-edit-diff-title S_line1"></div><ol class="yawf-feed-edit-list yawf-feed-edit-diff-list S_line1"></ol></div>`;
        const loadingText = container.querySelector('.yawf-feed-edit-loading .text');
        loadingText.textContent = i18n.viewEditLoading;
        const selectTitle = container.querySelector('.yawf-feed-edit-select-title');
        const diffTitle = container.querySelector('.yawf-feed-edit-diff-title');
        const selectList = container.querySelector('.yawf-feed-edit-select-list');
        const diffList = container.querySelector('.yawf-feed-edit-diff-list');
        const content = container.querySelector('.yawf-feed-edit-view-content');
        selectTitle.textContent = i18n.selectFeedVersion;
        diffTitle.textContent = i18n.diffFeedVersion;
        const versions = await feedHistoryPromise;
        const selectVersions = new WeakMap();
        const diffVersions = new WeakMap();
        let currentVersion = null;
        const highlightVersion = function (version, list) {
          const current = list.querySelector('.current');
          if (current) current.classList.remove('current', 'S_bg2');
          if (version) {
            version.classList.add('current', 'S_bg2');
            version.scrollIntoView({ block: 'nearest' });
          }
        };
        const setSelectVersion = function (version) {
          currentVersion = version;
          highlightVersion(selectVersions.get(version), selectList);
          highlightVersion(diffVersions.get(version), diffList);
          showContent(content, version, null);
        };
        const setDiffVersion = function (version) {
          highlightVersion(diffVersions.get(version), diffList);
          showContent(content, currentVersion, version);
        };
        [
          { timeList: selectList, onClick: setSelectVersion, versionMap: selectVersions },
          { timeList: diffList, onClick: setDiffVersion, versionMap: diffVersions },
        ].forEach(({ timeList, onClick, versionMap }) => {
          versions.forEach(version => {
            const li = document.createElement('li');
            li.classList.add('S_line1');
            li.innerHTML = '<a href="javascript:;" class="S_txt1"></a>';
            const a = li.firstChild;
            a.textContent = util.time.format(version.date, { format: 'month', locale: timeLocale });
            a.addEventListener('click', function (event) {
              if (!event.isTrusted) return;
              onClick(version);
            });
            timeList.appendChild(li);
            versionMap.set(version, li);
          });
        });
        setSelectVersion(versions[0]);
        setDiffVersion(versions[versions.length - 1]);
      };
      const showEditInfo = function (mid) {
        const feedHistoryPromise = request.feedHistory(mid);
        const historyDialog = ui.dialog({
          id: 'yawf-feed-edit',
          title: i18n.viewEditTitle,
          render(container) {
            dialogRender(container, feedHistoryPromise);
          },
        });
        historyDialog.show();
      };
      observer.feed.onAfter(function (feed) {
        const editedList = Array.from(feed.querySelectorAll('.WB_feed_detail .WB_from span[title]'));
        editedList.forEach(edited => {
          const feedNode = feedParser.feedNode(edited);
          const isForward = edited.closest('.WB_feed_expand');
          const mid = feedNode.getAttribute(isForward ? 'omid' : 'mid');
          const button = document.createElement('a');
          button.href = 'javascript:;';
          button.textContent = i18n.viewEditInfoEdited;
          button.classList.add('yawf-edited', 'S_txt2');
          edited.replaceWith(button);
          button.addEventListener('click', function () {
            showEditInfo(mid);
          });
        });
      });

      css.append(`
.yawf-feed-edit-dialog-content { width: 860px; height: 480px; display: flex; }
.yawf-feed-edit-select, .yawf-feed-edit-diff { width: 180px; text-align: center; padding-top: 40px; position: relative;}
.yawf-feed-edit-view { width: 500px; border: 0 solid; }
.yawf-feed-edit-select-list { direction: rtl; }
.yawf-feed-edit-select-title, .yawf-feed-edit-diff-title { font-weight: bold; padding: 10px 0; line-height: 19px; position: absolute; top: 0; width: calc(100% - 1px); border-bottom: 1px solid; }
.yawf-feed-edit-select-title, .yawf-feed-edit-select li { border-right: 1px solid; }
.yawf-feed-edit-diff-title, .yawf-feed-edit-diff li { border-left: 1px solid; }
.yawf-feed-edit-list { height: 100%; overflow: auto; }
.yawf-feed-edit-list::before { content: " "; border-right: 1px solid; border-right-color: inherit; position: absolute; top: 0; bottom: 0; }
.yawf-diff-same .yawf-diff-line-break { display: none; }
.yawf-feed-edit-select-list::before { right: 0; }
.yawf-feed-edit-diff-list::before { left: 0; }
.yawf-feed-edit-list li { line-height: 29px; direction: ltr; border-bottom: 1px solid; position: relative; }
.yawf-feed-edit-list li a { display: block; }
.yawf-feed-edit-list li a:hover, .yawf-feed-edit-list li.current a { font-weight: bold; }
.yawf-feed-edit-select-list li.current { border-right: 0; }
.yawf-feed-edit-diff-list li.current { border-left: 0; }
.yawf-feed-edit-view { overflow: auto; }
.yawf-feed-edit-view .WB_text { white-space: pre-wrap; }
.yawf-feed-edit-view .WB_media_wrap { margin-top: 10px; }
.yawf-diff-insert { text-decoration: underline; background: linear-gradient(to bottom, rgba(0, 255, 0, 0.15) 0, rgba(0, 255, 0, 0.15) calc(94% - 1px), currentColor 94%, currentColor 100%) }
.yawf-diff-delete { text-decoration: line-through; background: linear-gradient(to bottom, rgba(255, 0, 0, 0.15) 0, rgba(255, 0, 0, 0.15) calc(53% - 1px), currentColor 53%, currentColor 59%, rgba(255, 0, 0, 0.15) calc(59% + 1px), rgba(255, 0, 0, 0.15) 100%); }
.yawf-diff-line-break::before { content: "↵"; user-select: none; }
.yawf-img-insert { outline: 3px solid #3c3; }
.yawf-img-delete { outline: 3px dashed #c33; }
.yawf-img-reorder { outline: 3px dotted #36f; }
.yawf-feed-edit-view-content .WB_media_wrap ~ .WB_media_wrap { border-top-width: 1px; border-top-style: solid; padding-top: 10px; }
.yawf-diff-image-link { cursor: zoom-in; }
`);
    },
  });

  Object.assign(i18n, {
    viewArticleInline: {
      cn: '内嵌展示头条文章 {{i}}',
      tw: '內嵌展示頭條文章 {{i}}',
      en: 'Show articles inline {{i}}',
    },
    viewArticleInlineDetail: {
      cn: '付费内容可能无法在内嵌模式中正常查看，需要打开文章页浏览。',
    },
    foldArticle: { cn: '收起', en: 'View Less' },
    viewArticle: { cn: '查看文章', en: 'View Article' },
    feedArticle: { cn: '查看原微博', en: 'View Original Feed' },
    viewArticleSource: { cn: '查看源网址', tw: '查看源網址', en: 'View Source' },
    articleLoading: { cn: '正在加载……', tw: '正在載入……', en: 'Loading ...' },
    articleFail: { cn: '加载失败', tw: '载入失败', en: 'Failed to load article' },
  });

  // 直接在微博内显示头条文章
  content.viewArticleInline = rule.Rule({
    id: 'view_article_inline',
    version: 55,
    parent: content.content,
    template: () => i18n.viewArticleInline,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.viewArticleInlineDetail },
    },
    ainit() {
      // 当 iframe 内容的尺寸发生变化时，我们要将变化反馈给上层
      const resizeSensor = function (target, callback, /** @type {Document} */document, /** @type {Window} */window) {
        const container = document.createElement('div');
        container.innerHTML = '<div class="resize-sensor"><div class="resize-sensor-expand"><div class="resize-sensor-child"></div></div><div class="resize-sensor-shrink"><div class="resize-sensor-child"></div></div></div>';
        /** @type {HTMLDivElement} */
        const sensor = container.firstChild;
        /** @type {HTMLDivElement} */
        const expand = sensor.firstChild;
        /** @type {HTMLDivElement} */
        const shrink = expand.nextSibling;
        target.appendChild(sensor);

        let lastWidth = target.offsetWidth;
        let lastHeight = target.offsetHeight;
        let newWidth, newHeight, dirty;
        const reset = function () {
          expand.scrollTop = 1e8;
          expand.scrollLeft = 1e8;
          shrink.scrollTop = 1e8;
          shrink.scrollLeft = 1e8;
        };
        const onResized = function () {
          if (lastWidth === newWidth && lastHeight === newHeight) return false;
          lastWidth = newWidth;
          lastHeight = newHeight;
          callback();
          reset();
          return true;
        };
        const onScroll = function (event) {
          newWidth = target.offsetWidth;
          newHeight = target.offsetHeight;
          if (dirty) return; dirty = true;
          requestAnimationFrame(function () {
            dirty = false;
            if (onResized()) onScroll();
          });
        };
        reset();
        onScroll();
        expand.addEventListener('scroll', onScroll);
        shrink.addEventListener('scroll', onScroll);
      };

      // 要注入到卡片内的样式
      const injectStyle = `
.WB_editor_iframe_new .WB_feed_v3 { max-width: 100%; }
`;

      // 要注入到文章页的样式
      const contentStyle = `
html { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; line-height: 1.5; color: var(--text-color); font-family: var(--font-family); background: transparent; font-size: 16px; line-height: 1.5; word-wrap: break-word; }
body { margin: 0; overflow: hidden; }
* { box-sizing: border-box; }
> *:first-child { margin-top: 0 !important; }
> *:last-child { margin-bottom: 0 !important; }
a { background-color: transparent; color: var(--link-color); text-decoration: underline; }
blockquote { margin: 0 0 10px; padding: 0 1em; background: #80808022; border-left: 0.25em solid #80808044; padding: 20px; }
blockquote > :first-child { margin-top: 0; }
blockquote > :last-child { margin-bottom: 0; }
figure { margin: 0 0 10px; padding: 0 1em; text-align: center; }
figcaption { text-align: center; }
h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
h1 { margin: 0.67em 0; padding-bottom: 0.3em; font-size: 2em; border-bottom: 1px solid #80808022; }
h2 { padding-bottom: 0.3em; font-size: 1.5em; border-bottom: 1px solid #80808022; }
h3 { font-size: 1.25em; }
h4 { font-size: 1em; }
h5 { font-size: 0.875em; }
h6 { font-size: 0.85em; }
hr { box-sizing: content-box; overflow: hidden; height: 2px; padding: 0; margin: 24px 0; background-color: #80808011; border: 0; }
hr::after { display: table; clear: both; content: ""; }
hr::before { display: table; content: ""; }
img { border-style: none; max-width: 100%; box-sizing: content-box; background-color: var(--background-color); }
li + li { margin-top: 0.25em; }
li > p { margin-top: 16px; }
p { margin-top: 0; margin-bottom: 10px; }
p, blockquote, ul, ol, table { margin-top: 0; margin-bottom: 16px; }
table { border-spacing: 0; border-collapse: collapse; }
table th { font-weight: bold; }
table th, table td { padding: 6px 13px; border: 1px solid #80808044; }
table tr { border-top: 1px solid #ccc; }
table tr:nth-child(2n) { background-color: #80808011; }
td, th { padding: 0; }
ul, ol { padding-left: 2em; margin-top: 0; margin-bottom: 0; }
ul { list-style: outside; }
ul ul ol, ul ol ol, ol ul ol, ol ol ol { list-style-type: lower-alpha; }
ul ul, ul ol, ol ol, ol ul { margin-top: 0; margin-bottom: 0; }
iframe { width: 100%; border: 0 none; max-width: 600px; }
video { max-width: 100%; max-height: 100vh; }

body { position: relative; }
.resize-sensor, .resize-sensor-expand, .resize-sensor-shrink { position: absolute; top: 0; bottom: 0; left: 0; right: 0; overflow: hidden; z-index: -1; visibility: hidden; }
.resize-sensor-expand .resize-sensor-child { width: 100000px; height: 100000px; }
.resize-sensor-shrink .resize-sensor-child { width: 200%; height: 200%; }
.resize-sensor-child { position: absolute; top: 0; left: 0; transition: 0s; }
`;

      // 渲染文章
      const renderArticle = function (article, style, inForward) {
        const container = document.createElement('div');
        container.innerHTML = `
<div class="WB_expand_media_box clearfix">
<div class="WB_expand_media">
<div class="yawf-article S_bg2 S_line1">
<div class="tab_feed_a clearfix yawf-article-handle S_bg2"><div class="tab"><ul class="clearfix">
<li><span class="line S_line1"><a class="S_txt1 yawf-article-fold" href="javascript:;"><i class="W_ficon ficon_arrow_fold S_ficon">k</i></a></span></li>
<li><span class="line S_line1"><a class="S_txt1 yawf-article-view" href="" target="_blank"><i class="W_ficon ficon_search S_ficon">°</i></a></span></li>
<li><span class="line S_line1"><a class="S_txt1 yawf-article-feed" href="" target="_blank"><i class="W_ficon ficon_search S_ficon">\ue604</i></a></span></li>
<li><span class="line S_line1"><a class="S_txt1 yawf-article-source" href="" target="_blank" rel="no-referrer"><i class="W_ficon ficon_search S_ficon">l</i></a></span></li>
</ul></div></div>
<div class="yawf-article-body">
<div class="yawf-article-title"></div>
<div class="yawf-article-meta">
<span class="yawf-article-author"><a target="_blank"><img class="W_face_radius" /></a></span>
<span class="yawf-article-author-inner"></span>
<span class="yawf-article-time"></span>
</div>
<div class="yawf-article-lead"></div>
<div class="yawf-article-cover"><img /></div>
<div class="yawf-article-loading"><i class="W_loading"></i> </div>
<div class="yawf-article-content"><iframe title="" style="visibility: hidden; height: 1px;" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"></iframe></div>
</div>
</div>
</div>
</div>
`;
        if (!article.content) {
          const body = container.querySelector('.yawf-article-body');
          body.textContent = i18n.articleFail;
          return container;
        }
        // 标题
        const title = container.querySelector('.yawf-article-title');
        title.textContent = article.title || '';
        // 作者
        const author = container.querySelector('.yawf-article-author');
        if (article.author) {
          author.querySelector('img').src = article.author.avatar;
          const link = author.querySelector('a');
          link.appendChild(document.createTextNode(article.author.name));
          link.href = `https://weibo.com/u/${article.author.uid}`;
          link.setAttribute('usercard', `id=${article.author.uid}`);
        } else author.remove();
        const authorInner = container.querySelector('.yawf-article-author-inner');
        if (article.author && article.author.inner) {
          const inner = article.author.inner;
          if (inner.uid) {
            const link = document.createElement('a');
            link.textContent = inner.name;
            link.href = `https://weibo.com/u/${inner.uid}`;
            link.setAttribute('usercard', `id=${inner.uid}`);
            authorInner.appendChild(link);
          } else {
            authorInner.appendChild(document.createTextNode(inner.name));
          }
        } else authorInner.remove();
        // 日期
        const time = container.querySelector('.yawf-article-time');
        if (article.time) {
          time.textContent = article.time.replace(/\d\d-\d\d \d\d:\d\d/, str => {
            const year = new Date(Date.now() + 288e5).getUTCFullYear();
            const date = new Date(Date.UTC(year, ...str.split(/[- :]/).map((x, i) => i ? +x : x - 1)) - 288e5);
            return [
              ((date.getMonth() + 1) + '').padStart(2, 0), '-', (date.getDate() + '').padStart(2, 0), ' ',
              (date.getHours() + '').padStart(2, 0), ':', (date.getMinutes() + '').padStart(2, 0),
            ].join('');
          });
        } else time.remove();
        // 导语
        const lead = container.querySelector('.yawf-article-lead');
        if (article.lead) lead.textContent = article.lead;
        else lead.remove();
        // 封面图
        const cover = container.querySelector('.yawf-article-cover');
        if (article.cover) cover.firstChild.src = article.cover;
        else cover.remove();
        // 正在加载
        const loading = container.querySelector('.yawf-article-loading');
        loading.appendChild(document.createTextNode(i18n.articleLoading));
        // 内容
        /** @type {HTMLIFrameElement} */
        const iframe = container.querySelector('.yawf-article-content iframe');
        const html = `<!doctype html><html><head><meta charset="utf-8" /><meta name="referrer" content="no-referrer" /><title></title><style>${style}</style><style>${contentStyle}</style></head><body class="yawf-article-page">${article.content}</body></html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        iframe.addEventListener('load', function () {
          URL.revokeObjectURL(url);
          loading.remove();
          const document = iframe.contentDocument;
          const window = iframe.contentWindow;
          const resizeIframe = function () {
            iframe.style.height = document.body.clientHeight + 'px';
          };
          // 处理内容中的卡片
          Array.from(document.querySelectorAll('x-iframe')).forEach(async xiframe => {
            const oriUrl = xiframe.getAttribute('src');
            const html = await request.getArticleCard(oriUrl);
            const iframe = document.createElement('iframe');
            const blob = new Blob([html], { type: 'text/html' });
            const id = new URL(oriUrl).searchParams.get('id');
            const url = URL.createObjectURL(blob);
            iframe.src = url;
            iframe.dataset.cardId = id;
            iframe.addEventListener('load', () => {
              URL.revokeObjectURL(url);
              const document = iframe.contentDocument;
              const window = iframe.contentWindow;
              const style = document.body.appendChild(document.createElement('style'));
              style.textContent = injectStyle;
              const updateOuterSize = function () {
                iframe.style.height = document.body.clientHeight + 'px';
              };
              resizeSensor(document.body, updateOuterSize, document, window);
              setTimeout(updateOuterSize, 0);
            });
            xiframe.parentElement.replaceChild(iframe, xiframe);
          });
          resizeSensor(document.body, resizeIframe, document, window);
          setTimeout(function () {
            resizeIframe();
            iframe.style.visibility = 'visible';
          }, 0);
          // 添加自定义样式
          const userCss = layout.userCss.css;
          if (userCss.isEnabled()) {
            const style = document.createElement('style');
            style.textContent = userCss.ref.css.getConfig();
            document.body.appendChild(style);
          }
        });
        iframe.addEventListener('error', function () {
          loading.textContent = i18n.articleFail;
          iframe.remove();
        });
        return container;
      };

      // 隐藏图片或文章卡片
      const hideMedia = function (feed) {
        const mediaList = Array.from(feed.querySelectorAll('.WB_media_wrap, .WB_expand_media_box'));
        const rollback = [...mediaList].map(media => {
          if (!(media.clientHeight > 0)) return null;
          const display = window.getComputedStyle(media).display;
          media.style.display = 'none';
          return () => { media.style.display = display; };
        }).filter(x => x);
        return function () { rollback.forEach(f => f()); };
      };

      // 让文章内容适配周围的配色
      const computeStyle = function (reference) {
        const text = document.createElement('div');
        text.style = 'position: fixed; top: -1000px;';
        text.innerHTML = '<div class="WB_text W_f14">T<a>a</a><span class="S_bg2">B</span></div>';
        reference.appendChild(text);
        const link = getComputedStyle(text.querySelector('a'));
        const bg2 = getComputedStyle(text.querySelector('.S_bg2'));
        const selection = (function () {
          try {
            return getComputedStyle(text, '::selection');
          } catch (e) {
            try {
              return getComputedStyle(text, '::-moz-selection');
            } catch (e2) {
              return null;
            }
          }
        }());
        const css = `
:root {
--text-color: ${bg2.color};
--background-color: ${bg2.backgroundColor};
--link-color: ${link.color};

--font-family: ${bg2.fontFamily};
}

${selection ? `
::selection { background-color: ${selection.backgroundColor}; color: ${selection.color}; }
::-moz-selection { background-color: ${selection.backgroundColor}; color: ${selection.color}; }
` : ''}
`;
        text.remove();
        return css;
      };

      const renderArticleControls = function (article, articleData, { id, feed, text, showMedia }) {
        const fold = article.querySelector('.yawf-article-fold');
        fold.addEventListener('click', function () {
          article.remove();
          showMedia();
          feed.removeAttribute('yawf-article-shown');
          feed.scrollIntoView({ block: 'nearest' });
        });
        fold.appendChild(document.createTextNode(i18n.foldArticle));

        const view = article.querySelector('.yawf-article-view');
        view.href = `https://weibo.com/ttarticle/p/show?id=${id}`;
        view.appendChild(document.createTextNode(i18n.viewArticle));

        const oriFeed = article.querySelector('.yawf-article-feed');
        if (articleData.feed && new URL(articleData.feed).pathname !== location.pathname) {
          oriFeed.href = articleData.feed;
          oriFeed.appendChild(document.createTextNode(i18n.feedArticle));
        } else oriFeed.closest('li').remove();

        const source = article.querySelector('.yawf-article-source');
        if (articleData.source) source.href = articleData.source;
        else source.closest('li').remove();
        source.appendChild(document.createTextNode(i18n.viewArticleSource));
      };

      // 点击文章链接时触发
      document.addEventListener('click', async function (event) {
        if (event.shiftKey || event.ctrlKey || event.metaKey) return;
        const target = event.target;
        if (!(target instanceof Element)) return;
        const feed = target.closest('[mid]');
        if (!feed) return;
        const link = target.closest('[suda-uatrack*="1022-article"]');
        if (!link) return;
        const id = link.getAttribute('suda-uatrack').replace(/^.*1022%3A(\d+):.*$/, '$1');
        if (!id) return;
        const text = Array.from((/** @returns {Element} */function findText(target) {
          return target ? target.querySelector('.WB_text') ? target : findText(target.parentElement) : null;
        }(target)).querySelectorAll('.WB_text')).pop();
        if (!text) return;
        event.preventDefault();
        event.stopPropagation();
        if (feed.hasAttribute('yawf-article-shown')) return;

        const loading = document.createElement('div');
        loading.className = 'yawf-article-loading';
        loading.innerHTML = '<i class="W_loading"></i> ';
        loading.appendChild(document.createTextNode(i18n.articleLoading));
        feed.setAttribute('yawf-article-shown', '');
        text.parentElement.insertBefore(loading, text.nextSibling);

        const showMedia = hideMedia(feed);
        const articleData = await request.getArticle(id);
        const article = renderArticle(articleData, computeStyle(text), text.matches('.WB_expand *'));
        renderArticleControls(article, articleData, { id, feed, text, showMedia });

        loading.parentElement.replaceChild(article, loading);
      }, true);

      css.append(`
.yawf-article-loading { padding: 10px; text-align: center; }
.yawf-article-handle { position: sticky; top: 50px; padding: 10px 0; z-index: 1; font-size: 12px; line-height: 15px; }
.yawf-article { border-width: 1px; border-style: solid; padding: 10px; position: relative; font-size: 16px; line-height: 1.5; }
.yawf-article-title { margin: 10px 0; font-weight: bold; font-size: 130%; }
.yawf-article-meta { margin: 10px -10px; display: flex; }
.yawf-article-meta > span { padding: 0 10px; }
.yawf-article-meta > span:not(:first-child) { border-left: 1px solid #80808022; }
.yawf-article-author img { width: 20px; height: 20px; vertical-align: middle; margin: 0.2em; }
.yawf-article-lead { background: #80808022; padding: 20px; }
.yawf-article-cover { text-align: center; line-height: 0; }
.yawf-article-cover img { max-width: 100%; margin: 10px 0; vertical-align: top; }
.yawf-article-content iframe { border: 0 none; width: 100%; margin: 10px 0; }
`);
      if (layout.navbar.autoHide.isEnabled()) {
        css.append('.yawf-article-handle { top: 0; }');
      }
    },

  });

  Object.assign(i18n, {
    linkWithFace: {
      cn: '识别微博中包含表情符号的网址（实验性）{{i}}||{{clean}} 删除表情|{{link}} 创建链接',
      tw: '辨識微博中包含表情符號的（實驗性）{{i}}||{{clean}} 刪除表情|{{link}} 創建連結',
      en: 'Recognize urls with faces in feeds (experimental) {{i}}||{{clean}} Remove faces|{{link}} Generate link',
    },
    linkWithFaceDetail: {
      cn: '创建的链接可以指向任何第三方网站，请在点击前自行确认安全性。选中并复制时如果复制内容为微博中的网址，脚本会将复制的内容清理为链接本身。表情仅支持微博自带表情，不支持 emoji 表情。',
    },
  });

  content.linkWithFace = rule.Rule({
    id: 'link_with_face',
    version: 66,
    parent: content.content,
    template: () => i18n.linkWithFace,
    ref: {
      clean: { type: 'boolean' },
      link: { type: 'boolean' },
      i: { type: 'bubble', icon: 'warn', template: () => i18n.linkWithFaceDetail },
    },
    ainit() {
      const urlRegexGen = () => new RegExp([
        // 协议
        'https?://',
        // 不是 t.cn 的短链接
        '(?!t.cn(?:/|$))',
        // 主机名或 IP
        '(?:(?![.-])(?:(?![.-][./:-])[a-zA-Z0-9.-])*|\\d+\\.\\d+\\.\\d+\\.\\d+)',
        // 端口
        '(?::\\d+)?',
        // 路径，查询串，本地部分
        '(?:/(?:[a-zA-Z0-9$\\-_.+!*\'(),/;:@&=?#]|%[a-fA-F0-9]{2})*)?',
      ].join(''), 'g');
      const clean = this.ref.clean.getConfig();
      const link = this.ref.clean.getConfig();

      observer.feed.onAfter(function (feed) {
        /** @type {Element[]} */
        const contentElements = [
          feedParser.content.dom(feed, false, false),
          feedParser.content.dom(feed, false, true),
          feedParser.content.dom(feed, true, false),
          feedParser.content.dom(feed, true, true),
        ].filter(element => element instanceof Element);

        contentElements.forEach(element => {
          const unfold = element.querySelector('[action-type="fl_unfold"]');
          const nodes = [...element.childNodes];
          let text = '';
          /** @type {[number, number, Node][]} */
          const nodeData = nodes.map(node => {
            const pos = text.length;
            if (node.nodeType === Node.TEXT_NODE) {
              text += node.textContent;
              return [pos, node.textContent.length, node];
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('img.W_img_face')) {
                return [pos, 0, node];
              } else {
                text += '\n';
                return [pos, 1, node];
              }
            } else {
              return [pos, 0, node];
            }
          });
          let match;
          const urlRegex = urlRegexGen();
          while ((match = urlRegex.exec(text)) !== null) {
            let url;
            try { url = new URL(match[0]); } catch (e) { continue; }
            const index = match.index, lastIndex = match.index + match[0].length;
            // 如果有展开全文按钮，而且链接匹配到了最后面，那么可能链接不完整，此时不识别
            if (unfold && lastIndex >= text.replace(/[\s.\u200b]*$/, '').length) continue;
            const start = nodeData.findIndex(([pos, len]) => pos <= index && pos + len > index);
            const end = nodeData.findIndex(([pos, len]) => pos < lastIndex && pos + len >= lastIndex);
            if (start === -1 || end === -1 || start === end) continue;
            const [startNodePos, _startNodeLength, startNode] = nodeData[start];
            const [endNodePos, _endNodeLength, endNode] = nodeData[end];
            if (!(startNode instanceof Text)) continue;
            if (!(endNode instanceof Text)) continue;
            const container = document.createDocumentFragment();
            let wrap = container;
            if (link) {
              wrap = container.appendChild(document.createElement('a'));
              wrap.href = url;
              wrap.setAttribute('rel', 'nofollow noopener');
              wrap.setAttribute('target', '_blank');
              wrap.className = 'yawf-face-link';
            }
            wrap.appendChild(document.createTextNode(startNode.textContent.slice(index - startNodePos)));
            startNode.textContent = startNode.textContent.slice(0, index - startNodePos);
            for (let i = start + 1; i < end; i++) {
              const node = nodes[i];
              if (node.nodeType !== Node.TEXT_NODE && clean) {
                node.parentNode.removeChild(node);
              } else {
                wrap.appendChild(nodes[i]);
              }
            }
            wrap.appendChild(document.createTextNode(endNode.textContent.slice(0, lastIndex - endNodePos)));
            endNode.textContent = endNode.textContent.slice(lastIndex - endNodePos);
            wrap.normalize();
            endNode.parentNode.insertBefore(wrap, endNode);
          }
        });
      });

      window.addEventListener('copy', event => {
        const selection = document.getSelection();
        if (selection.rangeCount !== 1) return;
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        if (!(container instanceof Element)) return;
        if (!container.matches('.WB_text')) return;
        const contents = range.cloneContents();
        const text = [...contents.childNodes].map(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
          } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'IMG') {
            return '';
          } else {
            return '\n';
          }
        }).join('').trim();
        const urlRegex = urlRegexGen();
        if (!urlRegex.test(text)) return;
        event.clipboardData.setData('text/plain', text);
        event.preventDefault();
      });

    },
  });

  Object.assign(i18n, {
    shortLinkWithoutConfirm: {
      cn: '打开短链接时无需二次确认（全局设置） {{i}}',
      tw: '打開簡短的連接時無需二次確認（全局設定） {{i}}',
      en: 'Open short URL without another confirmation (Global Option) {{i}}',
    },
    shortLinkWithoutConfirmDetail: {
      cn: '打开短链接时无需二次手动确认。由于短链接网页无法获取登录状态，此设置项无论登录任意用户均会生效',
    },
  });

  content.shortLinkWithoutConfirm = rule.Rule({
    id: 'short_url_wo_confirm',
    version: 73,
    get configPool() { return config.global; },
    parent: content.content,
    template: () => i18n.shortLinkWithoutConfirm,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.shortLinkWithoutConfirmDetail },
    },
    // 真正的执行逻辑在单独的文件里
    // 这段是处理一下奇怪的追踪代码导致链接根本打不开的问题
    // 建议如果真的想加追踪代码，在 mouseup 时改 href，而不是在 click 的时候 window.open
    init() {
      document.addEventListener('click', event => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (!target.matches('[action-type="feed_list_url"]')) return;
        event.stopPropagation();
      }, true);
    },
  });

}());
