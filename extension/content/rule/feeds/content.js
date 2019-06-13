; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const commentParser = yawf.comment;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;

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
    cn: '增大微博正文字号为|原大小的{{ratio}}',
    tw: '加大微博內文字體為|原大小的{{ratio}}',
    en: 'Increase font size for weibo content | to {{ratio}}',
  };

  content.fontSize = rule.Rule({
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
      const { fs, lh, fs2, lh2, h, h2, fs3 } = {
        120: { fs: 16, lh: 26, fs2: 14, lh2: 24, h: 20, h2: 18, fs3: 12 },
        150: { fs: 21, lh: 32, fs2: 18, lh2: 27, h: 25, h2: 23, fs3: 14 },
        200: { fs: 28, lh: 42, fs2: 24, lh2: 36, h: 33, h2: 29, fs3: 19 },
        300: { fs: 42, lh: 64, fs2: 36, lh2: 54, h: 50, h2: 46, fs3: 28 },
      }[this.ref.ratio.getConfig()];
      const style = `
.WB_info, .WB_text, .WB_info *, .WB_text * { font-size: ${fs}px !important; line-height: ${lh}px !important; }
.WB_feed_expand .WB_info *, .WB_feed_expand .WB_text *, .WB_feed_expand .WB_info, .WB_feed_expand .WB_text { font-size: ${fs2}px !important; line-height: ${lh2}px !important; }
.WB_text .W_btn_b { height: ${h}px !important; }
.WB_text .W_btn_b, .WB_text .W_btn_b * { line-height: ${h}px !important; font-size: ${fs2}px !important; }
.WB_feed_expand .WB_text .W_btn_b, .WB_text .W_btn_c, .WB_empty .W_btn_c { height: ${h2}px !important; line-height: ${h2}px !important; }
.WB_feed_expand .WB_text .W_btn_b, .WB_feed_expand .WB_text .W_btn_b *, .WB_text .W_btn_c *, .WB_empty .W_btn_c * { line-height: ${h2}px !important; font-size: ${fs3}px !important; }
.W_icon_feedpin, .W_icon_feedhot { height: 16px !important; line-height: 16px !important; }
`;
      css.append(style);
    },
  });

  i18n.autoExpandLongFeeds = {
    cn: '自动展开|不超过{{count}}字的微博|（每个换行符计{{br}}字）',
    tw: '自動展開|不超過{{count}}個字的微博|（每個換行符計{{br}}字）',
    en: 'Automatically unfold weibo | within {{count}} characters || (count each line break as {{br}} characters)',
  };

  content.expandLong = rule.Rule({
    id: 'feed_long_expand',
    version: 1,
    parent: content.content,
    template: () => i18n.autoExpandLongFeeds,
    ref: {
      count: { type: 'range', min: 140, max: 2000, step: 10, initial: 200 },
      br: { type: 'range', min: 1, max: 60, step: 1, initial: 30 },
    },
    // 这个设置项的相关逻辑实现在 content/rule/feed/feed/long.js
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
          placeholder.className = 'yawf-linebreak';
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

}());
