; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;
  const message = yawf.message;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;

  const details = layout.details = {};

  i18n.detailsToolGroupTitle = {
    cn: '细节',
    tw: '細節',
    en: 'Details',
  };

  details.details = rule.Group({
    parent: layout.layout,
    template: () => i18n.detailsToolGroupTitle,
  });


  i18n.styleTextFontFamily = {
    cn: '替换网页字体为|西文{{west}}|中文{{chinese}}',
    tw: '替換網頁字形為|西文{{west}}|中文{{chinese}}',
    en: 'Customize fonts on webpage | Western {{west}} | Chinese {{chinese}}',
  };

  const supportedFonts = message.invoke.getSupportedFontList();

  layout.fontFamily = rule.Rule({
    id: 'font_family',
    parent: details.details,
    template: () => i18n.styleTextFontFamily,
    ref: {
      west: {
        type: 'select',
        select: supportedFonts.then(fonts => (
          fonts.west.map(([cssName, name]) => ({ value: name, text: name }))
        )),
      },
      chinese: {
        type: 'select',
        select: supportedFonts.then(fonts => (
          fonts.chinese.map(([cssName, name]) => ({ value: name, text: name }))
        )),
      },
    },
    async ainit() {
      const west = this.ref.west.getConfig();
      const chinese = this.ref.chinese.getConfig();
      const fonts = await supportedFonts;
      const [westCssname] = fonts.west.find(([_, name]) => name === west);
      const [chineseCssname] = fonts.chinese.find(([_, name]) => name === chinese);
      css.append(`html body, html body.WB_macT, html body.WB_xpT, html .WB_webim { font-family: ${westCssname}, ${chineseCssname}; }`);
    },
  });

  Object.assign(i18n, {
    avatarShape: {
      cn: '统一头像形状为|{{shape}}',
      hk: '統一頭像形狀為|{{shape}}',
      en: 'Show all avatars as | {{shape}}',
    },
    avatarShapeCircle: {
      cn: '圆形',
      hk: '圓形',
      en: 'Circle',
    },
    avatarShapeSquare: {
      cn: '方形',
      en: 'Square',
    },
  });

  details.avatarShape = rule.Rule({
    id: 'avatarShape',
    parent: details.details,
    template: () => i18n.avatarShape,
    ref: {
      shape: {
        type: 'select',
        initial: 'square',
        select: [
          { value: 'circle', text: () => i18n.avatarShapeCircle },
          { value: 'square', text: () => i18n.avatarShapeSquare },
        ],
      },
    },
    ainit() {
      const shape = this.ref.shape.getConfig();
      if (shape === 'square') {
        css.append(`.W_face_radius, .W_person_info .cover .headpic, .PCD_header .pf_photo, .PCD_header .photo_wrap, .PCD_header .pf_photo .photo, .PCD_user_a .picitems .pic_box, .PCD_connectlist .follow_box .mod_pic img, .PCD_ut_a .pic_box, .PCD_counter_b .pic_box, .WB_feed_v3 .WB_sonFeed .WB_face, .WB_feed_v3 .WB_sonFeed .WB_face .face img { border-radius: 0 !important; }`);
      } else {
        css.append(`img[usercard], .WB_face img { border-radius: 50% !important; }`);
      }
    },
  });


  if (!(function isCst() {
    // 如果用户使用的是已经是和东八区一致的时区，那么我们就不提供这个功能了
    const year = new Date().getFullYear();
    return [...Array(366)].every((_, i) => new Date(year, 0, i).getTimezoneOffset() === -480);
  }())) {

    Object.assign(i18n, {
      useLocaleTimezone: {
        cn: '使用本机时区',
        tw: '使用本機時區',
        en: 'Use locale timezone',
      },
      timeToday: { cn: '今天', tw: '今天', en: 'Today' },
      timeSecondBefore: { cn: '秒前', tw: '秒前', en: ' secs ago' },
      timeMinuteBefore: { cn: '分钟前', tw: '分鐘前', en: ' mins ago' },
      timeMonthDay: { cn: '{1}月{2}日 {3}:{4}', en: '{1}-{2} {3}:{4}' },
      feedsRead: { cn: '你看到这里', tw: '你看到這裡', en: 'you got here' },
    });

    // 使用本地时区
    details.timezone = rule.Rule({
      id: 'timezone',
      parent: details.details,
      template: () => i18n.useLocaleTimezone,
      ainit() {
        // $CONFIG.timeDiff 保存了本机时间与服务器时间的差，减去这个差值可得到服务器时间的近似值
        const now = () => new Date(Date.now() - ((init.page.$CONFIG || {}).timeDiff || 0));

        /**
         * @param {Date|number} time
         * @param {boolean?} locale
         * @returns {[string, string, string, string, string, string, string]}
         */
        const timeToParts = (time, locale = true) => (
          new Date(time - new Date(time).getTimezoneOffset() * 6e4 * locale)
            .toISOString().match(/\d+/g)
        );

        const formatTime = function (time) {
          const ref = now();
          const [iy, im, id, ih, iu] = timeToParts(time);
          const [ny, nm, nd, nh, nu] = timeToParts(ref);
          const diff = (ref - time) / 1e3;
          if (iy !== ny) {
            return `${iy}-${im}-${id} ${ih}:${iu}`;
          } else if (im !== nm || id !== nd) {
            return i18n.timeMonthDay.replace(/\{\d\}/g, n => [im, id, ih, iu][n[1] - 1]);
          } else if (ih !== nh && diff > 3600) {
            return `${i18n.timeToday} ${ih}:${iu}`;
          } else if (diff > 50) {
            return Math.ceil(diff / 60) + i18n.timeMinuteBefore;
          } else {
            return Math.max(Math.ceil(diff / 10), 1) * 10 + i18n.timeSecondBefore;
          }
        };

        const formatter = Intl.DateTimeFormat(
          { cn: 'zh-CN', hk: 'zh-HK', tw: 'zh-TW', en: 'en-US' }[util.language],
          {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'long',
          }
        );
        const formatTimeDetail = function (date) {
          return formatter.format(date);
        };

        const updateDate = function (element) {
          const date = parseInt(element.getAttribute('yawf-date'), 10);
          element.textContent = formatTime(date);
          element.title = formatTimeDetail(date);
        };

        const updateAllDate = function () {
          const dates = document.querySelectorAll('[yawf-date]');
          Array.from(dates).forEach(element => {
            updateDate(element);
          });
        };

        const handleDateElements = function handleDateElements() {
          const [feedListTimeTip, ...moreFeedListTimeTip] = document.querySelectorAll('[node-type="feed_list_timeTip"][date]');
          moreFeedListTimeTip.forEach(element => element.remove());
          if (feedListTimeTip) (function (tip) {
            const olds = document.querySelectorAll('[node-type="yawf-feed_list_timeTip"][date]');
            Array.from(olds).forEach(element => element.remove());
            tip.setAttribute('node-type', 'yawf-feed_list_timeTip');
            const date = parseInt(tip.getAttribute('date'), 10);
            tip.removeAttribute('date');
            tip.classList.add('yawf-feed_list_timeTip');
            tip.innerHTML = '<div class="WB_cardtitle_a W_tc"><a node-type="feed_list_item_date" style="color:inherit"></a></div>';
            const inner = tip.firstChild.firstChild;
            inner.setAttribute('yawf-date', date);
            inner.after(' ' + i18n.feedsRead);
          }(feedListTimeTip));

          const dateElements = Array.from(document.querySelectorAll('[date]'));
          dateElements.forEach(element => {
            const date = parseInt(element.getAttribute('date'), 10);
            element.setAttribute('yawf-date', date);
            element.removeAttribute('date');
          });

          if (feedListTimeTip || dateElements.length) updateAllDate();
        };

        observer.add(handleDateElements);
        setInterval(updateAllDate, 1e3);

        const parseTextTime = function (text) {
          let parseDate = null;
          const now = Date.now();
          const [cy, cm, cd] = timeToParts(now);
          if (/^\d+-\d+-\d+ \d+:\d+$/.test(text)) {
            const [y, m, d, h, u] = text.match(/\d+/g);
            parseDate = Date.UTC(y, m - 1, d, h, u) - 288e5;
          } else if (/^(?:\d+-\d+|\d+月\d+日) \d+:\d+$/.test(text)) {
            const [m, d, h, u] = text.match(/\d+/g);
            parseDate = Date.UTC(cy, m - 1, d, h, u) - 288e5;
          } else if (/^(?:今天|today)\s*\d+:\d+$/i.test(text)) {
            const [h, u] = text.match(/\d+/g);
            parseDate = Date.UTC(cy, cm - 1, cd, h, u) - 288e5;
          } else if (/^\s*\d+\s*(?:分钟前|分鐘前|mins ago)/.test(text)) {
            const min = text.match(/\d+/g);
            parseDate = now - min * 6e4;
          } else if (/^\s*\d+\s*(?:秒前|secs ago)/.test(text)) {
            const sec = text.match(/\d+/g);
            parseDate = now - sec * 1e3;
          }
          return parseDate ? new Date(parseDate) : null;
        };

        // 处理文本显示的时间
        const handleTextDateElements = function changeDateText() {
          const selectors = [
            '.WB_from:not([yawf-localtime])',
            '.cont_top .data:not([yawf-localtime])',
            'legend:not([yawf-localtime])',
          ].join(',');
          const elements = Array.from(document.querySelectorAll(selectors));
          elements.forEach(element => {
            element.setAttribute('yawf-localtime', '');
            // 聊天窗口中的时间是本地的时间，但是其实现在已经没有聊天窗口了
            if (element.matches('.WB_webim *')) return;
            const textNode = element.firstChild;
            if (textNode.nodeType !== Node.TEXT_NODE) return;
            const text = textNode.textContent.trim();
            if (text === '') return;
            const [_full, match, tail] = text.match(/^(.*?)\s*(来自|來自|come from|)$/);
            const time = parseTextTime(text);
            if (!time) return;
            util.debug('parse time %o(%s) to %o(%s)', textNode, text, new Date(time), new Date(time));
            textNode.textContent = tail ? ` ${tail} ` : '';
            const timeElement = document.createElement('span');
            timeElement.setAttribute('yawf-date', time);
            updateDate(timeElement);
          });
        };

        observer.add(handleTextDateElements);
      },
    });
  }

}());
