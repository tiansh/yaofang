; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const request = yawf.request;
  const feedParser = yawf.feed;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;
  const ui = util.ui;

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
      cn: '投票微博显示投票情况{{i}}',
      tw: '投票微博顯示投票情況{{i}}',
      en: 'Show votes for feeds with voting {{i}}',
    },
    showVoteResultDetail: {
      cn: '在当前页面展示投票结果而无需打开新页。展示仅供查看，如需投票仍需要在新页面打开。另请注意，无论是否开启本功能，微博投票会导致您自动点赞该微博。',
      tw: '在當前頁面展示投票結果而無需打開新頁。展示僅供查看，如需投票仍需要在新頁面打開。另請注意，無論是否開啟本功能，微博投票會導致您自動點贊該微博。',
      en: "View other's votes without open a new page. You are still required to open the new page to vote. Please be noticed that, voting will automatically like the feed regardless whether this option is enabled or not.",
    },
    followVoteLink: {
      cn: '点赞微博并参与投票',
      tw: '點贊微博並參與投票',
      en: 'Like this feed and vote',
    },
  });

  content.showVoteResult = rule.Rule({
    id: 'show_vote_result',
    version: 33,
    parent: content.content,
    template: () => i18n.showVoteResult,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.showVoteResultDetail },
    },
    ainit() {
      observer.feed.onAfter(async function (/** @type {Element} */feed) {
        const voteCard = feed.querySelector('.WB_feed_spec[action-type="fl_jumpurl"][action-data*="vote.weibo.com"]');
        if (!voteCard) return;
        const url = new URL(new URLSearchParams(voteCard.getAttribute('action-data')).get('url'));
        if (!url.href.startsWith('https://vote.weibo.com/h5/index/index?')) return;
        const voteId = url.searchParams.get('vote_id');
        if (!voteId) return;
        const placeholder = document.createElement('div');
        voteCard.parentNode.parentNode.replaceChild(placeholder, voteCard.parentNode);
        const voteResult = await request.voteDetail(voteId);
        const template = document.createElement('div');
        template.innerHTML = '<div class="yawf-vote-detail S_txt1 S_bg2 "><div class="yawf-vote-title"></div><div class="yawf-vote-subtitle S_txt2"></div><div class="yawf-vote-option-list"></div><div class="yawf-vote-footer"></div></div>';

        const container = template.firstChild;
        const title = container.querySelector('.yawf-vote-title');
        const subtitle = container.querySelector('.yawf-vote-subtitle');
        const optionList = container.querySelector('.yawf-vote-option-list');
        const footer = container.querySelector('.yawf-vote-footer');
        const voteInfo = voteResult.vote_info;
        const withImage = voteInfo.option_list.some(option => option.pic);
        if (withImage) {
          optionList.classList.add('yawf-vote-with-image');
        }

        title.textContent = voteInfo.title;
        // 未截至的投票会出现形如“截止日期 x年x月x日 xx::xx”格式的字串
        // 此时识别后面的日期以方便“使用本机时区”功能将其修正为本机时间
        if (/^.*\d+年\d+月\d+日 \d+:\d+$/.test(voteInfo.show_str)) {
          const [_i, text, dateStr] = voteInfo.show_str.match(/^(.*?)(\d+年\d+月\d+日 \d+:\d+)$/);
          const [_j, year, month, date, hour, min] = dateStr.match(/(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/);
          const timestamp = Date.UTC(year, month - 1, date, hour - 8, min);
          subtitle.appendChild(document.createTextNode(text));
          const dateText = subtitle.appendChild(document.createElement('span'));
          dateText.textContent = dateStr;
          dateText.setAttribute('date', timestamp);
        } else {
          subtitle.textContent = voteInfo.show_str;
        }
        voteInfo.option_list.forEach(option => {
          const wrap = document.createElement('div');
          wrap.innerHTML = '<div class="yawf-vote-option-item"><div class="yawf-vote-option-text"><span class="yawf-vote-option-title"></span><span class="yawf-vote-option-count"></span></div><div class="yawf-vote-option-bar S_bg1"></div></div>';
          const container = wrap.firstChild;
          const text = container.firstChild.firstChild;
          text.textContent = option.title;
          const count = text.nextSibling;
          count.textContent = option.part_num;
          container.style.setProperty('--yawf-vote-ratio', option.part_ratio / 100);
          if (withImage) {
            const wrap = document.createElement('div');
            wrap.innerHTML = '<div class="yawf-vote-option-image"><img /></div>';
            const img = wrap.firstChild.firstChild;
            img.src = option.pic;
            img.alt = option.text;
            container.insertBefore(wrap.firstChild, container.firstChild);
          }
          if (option.selected === '1') {
            container.classList.add('yawf-vote-selected');
          }
          optionList.appendChild(container);
        });
        if (voteInfo.status === '1') {
          const link = document.createElement('div');
          link.classList.add('yawf-vote-link');
          link.setAttribute('action-type', voteCard.getAttribute('action-type'));
          link.setAttribute('action-data', voteCard.getAttribute('action-data'));
          link.textContent = i18n.followVoteLink;
          footer.appendChild(link);
        }
        placeholder.replaceWith(container);
      });

      const fontRatio = content.fontSize.isEnabled() ? content.fontSize.ref.ratio.getConfig() : 100;
      const fontSize = { 120: 14, 150: 14, 200: 16, 300: 20 }[fontRatio] || 12;
      const smallImage = yawf.rules.feeds.layout.smallImage.isEnabled();
      css.append(`
.yawf-vote-detail { font-size: ${fontSize}px; }
.yawf-vote-detail { margin-left: 10px; padding: 10px; box-shadow: 0 0 2px #777; border-radius: 3px; }
.yawf-vote-title { font-weight: bold; line-height: 1.5; }
.yawf-vote-option-item { border: 1px solid #ebebeb; margin: 5px 0; line-height: 2; padding: 0 5px; position: relative; }
.yawf-vote-option-text { overflow: hidden; position: relative; z-index: 1; }
.yawf-vote-option-count { float: right; }
.yawf-vote-option-count::before { content: "("; }
.yawf-vote-option-count::after { content: ")"; }
.yawf-vote-option-bar { content: " "; width: calc(100% * var(--yawf-vote-ratio)); height:100%; position: absolute; top: 0; left: 0; z-index: 0; }
.yawf-vote-selected { font-weight: bold; }
.yawf-vote-with-image { display: grid; grid-template-columns: 1fr 1fr; grid-template-columns: repeat(auto-fill, ${smallImage ? '120px' : '225px'}); grid-gap: 10px; }
.yawf-vote-option-image { position: relative; z-index: 2; margin: 0 -5px -5px;}
.yawf-vote-option-image img { max-width: 100%; max-height: 225px; }
.yawf-vote-footer:empty { display: none; }
.yawf-vote-footer { margin-top: 10px; cursor: pointer; }
.yawf-vote-link { display: inline-block; }
`);
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
      en: 'Click "Edited" ',
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
        let last = { type: 'same', str: '' };
        const result = [last, ...output.reverse().map(({ type, chars }) => {
          const str = chars.join('');
          if (type === last.type) {
            last.str += str;
            return null;
          }
          last = { type, str };
          return last;
        })].filter(content => content && content.str);
        return result;
      };
      const renderTextDiff = function (container, source, target) {
        const diff = compare(source, target);
        const fragement = document.createDocumentFragment();
        diff.forEach(function ({ type, str }) {
          str.split(/(\n)/g).forEach(part => {
            const span = document.createElement('span');
            span.classList.add('yawf-diff-' + type);
            fragement.appendChild(span);
            if (part === '\n') {
              span.classList.add('S_txt2', 'yawf-diff-line-break');
              fragement.appendChild(document.createElement('br'));
            } else {
              span.textContent = part;
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
          const html = container.innerHTML;
          const items = Array.from(container.querySelectorAll('li'));
          const actionDatas = new Set(items.map(getId));
          return [container, html, items, actionDatas];
        };
        const renderImages = function (images) {
          ref.parentNode.appendChild(images);
        };
        const [sourceImg, sourceHtml, sourceItems, sourceActionDatas] = getImages(source);
        const [targetImg, targetHtml, targetItems, targetActionDatas] = getImages(target);
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
            a.textContent = util.time.format(version.date, 'month');
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
        const edited = feed.querySelector('.WB_feed_detail .WB_from span[title]');
        if (!edited) return;
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
.yawf-diff-same.yawf-diff-line-break::before { display: none; }
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
`);
    },
  });


}());
