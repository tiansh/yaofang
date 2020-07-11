; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const init = yawf.init;
  const fontList = yawf.fontList;
  const chatframe = yawf.chatframe;
  const backend = yawf.backend;
  const feedParser = yawf.feed;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;
  const time = util.time;
  const strings = util.strings;

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

  const supportedFonts = fontList.get();

  layout.fontFamily = rule.Rule({
    id: 'font_family',
    version: 1,
    parent: details.details,
    template: () => i18n.styleTextFontFamily,
    ref: {
      west: {
        type: 'select',
        select: supportedFonts.then(fonts => (
          fonts.west.map(([cssName, name]) => ({
            value: name,
            text: name,
            style: `font-family: ${cssName}; font-size: 120%;`,
          }))
        )),
      },
      chinese: {
        type: 'select',
        select: supportedFonts.then(fonts => (
          fonts.chinese.map(([cssName, name]) => ({
            value: name,
            text: name,
            style: `font-family: ${cssName}; font-size: 120%;`,
          }))
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
    id: 'layout_avatar_shape',
    version: 1,
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

  Object.assign(i18n, {
    fastFace: { cn: '表情选择框优先列出常用及置顶表情|{{clear}}', tw: '表情選擇框優先列出常用及置頂表情|{{clear}}', en: 'List top and recent emoji on the top of emoji selector | {{clear}}' },
    fastFaceTop: { cn: '置顶', tw: '置頂', en: 'Top' },
    fastFaceTopNotice: { cn: '将下方表情拖放至此置顶', tw: '將下方表情拖放至此置頂', en: 'Drag emoji and drop here to sticky' },
    fastFaceRecent: { cn: '最近', tw: '最近', en: 'Recent' },
    fastFaceClear: { cn: '清空列表', tw: '清除清單', en: 'Clear List' },
  });

  details.fastFace = rule.Rule({
    id: 'layout_fast_face',
    version: 1,
    parent: details.details,
    template: () => i18n.fastFace,
    ref: Object.assign({}, ...['top', 'recent'].map(key => ({
      [key]: {
        initial: [],
        normalize(value) {
          const emptyList = Array(10).fill(null);
          if (!Array.isArray(value)) return emptyList;
          return value.filter(item => {
            if (item === null) return true;
            if (item && item.title && item.img && item.text) return true;
            return false;
          }).concat(emptyList).slice(0, 10);
        },
      },
    })), {
      clear: {
        render() {
          const container = document.createElement('div');
          container.innerHTML = '<a class="W_btn_b yawf-clear-face" href="javascript:;"><span class="W_f14"></span></a>';
          container.querySelector('span').textContent = i18n.fastFaceClear;
          container.firstChild.addEventListener('click', event => {
            if (!event.isTrusted) return;
            details.fastFace.ref.top.setConfig();
            details.fastFace.ref.recent.setConfig();
          });
          return container.firstChild;
        },
      },
    }),
    ainit() {
      const rule = this;
      // 显示一个表情；聊天窗口里面表情输入的格式和别的地方不一样
      const createFaceItem = function (face, isIm) {
        const li = document.createElement('li');
        if (!face) return li;
        li.title = face.title;
        li.setAttribute('action-data', `${isIm ? 'text' : 'insert'}=${face.text}`);
        li.setAttribute('action-type', isIm ? 'webim_phiz_face' : 'select');
        const img = li.appendChild(document.createElement('img'));
        img.src = face.img;
        return li;
      };
      /**
       * 将列表显示出来，调整顺序尽量保留已有的表情的位置
       * @param {HTMLUListElement} ul
       * @param {{title, text, img}[]} faceList
       * @param {boolean} isIm
       */
      const renderListKeepOld = function (ul, faceList, isIm) {
        const listItems = Array.from(ul.querySelectorAll('li'));
        const newFaceTitles = new Set(faceList.map(e => e && e.title).filter(t => t));
        const emptySlots = [];
        listItems.forEach(li => {
          const title = li.title;
          const existInNew = newFaceTitles.has(title);
          if (existInNew) newFaceTitles.delete(title);
          else if (li.title) {
            const newLi = createFaceItem(null, isIm);
            li.replaceWith(newLi);
            emptySlots.push(newLi);
          } else {
            emptySlots.push(li);
          }
        });
        [...newFaceTitles].forEach(title => {
          const face = faceList.find(face => face.title === title);
          emptySlots.shift().replaceWith(createFaceItem(face, isIm));
        });
      };
      /**
       * 将列表显示出来，不调整顺序可能修改已有的表情位置
       * @param {HTMLUListElement} ul
       * @param {{title, text}[]} faceList
       * @param {boolean} isIm
       */
      const renderListKeepIndex = function (ul, faceList, isIm) {
        const listItems = Array.from(ul.querySelectorAll('li'));
        faceList.forEach((face, index) => {
          const listItem = listItems[index];
          if (listItem.title === (face && face.title || '')) return;
          listItem.replaceWith(createFaceItem(face, isIm));
        });
      };
      const renderRecentList = function () {
        const lists = document.querySelectorAll('.yawf-face-recent ul');
        const faceList = rule.ref.recent.getConfig();
        lists.forEach(list => {
          renderListKeepOld(list, faceList, list.matches('.yawf-face-im *'));
        });
      };
      const renderTopList = function () {
        const lists = document.querySelectorAll('.yawf-face-top ul');
        const faceList = rule.ref.top.getConfig();
        lists.forEach(list => {
          renderListKeepIndex(list, faceList, list.matches('.yawf-face-im *'));
        });
      };
      /**
       * 从被点击的对象（图片或者列表项）得到表情的相关信息
       * @param {HTMLElement} target
       */
      const getFace = function (target) {
        const li = target.closest('li');
        try {
          const face = {
            title: li.title,
            text: new URLSearchParams(li.getAttribute('action-data')).get('insert'),
            img: li.querySelector('img').src,
          };
          if (!face.title || !face.text || !face.img) return null;
          return face;
        } catch (e) { return null; }
      };
      // 从列表中移除重复的项，并保留 10 个
      const removeDuplicate = function (faceList) {
        const faceTitle = new Set(), result = [];
        faceList.forEach(face => {
          if (!face || faceTitle.has(face.title)) return;
          faceTitle.add(face.title);
          result.push(face);
        });
        while (result.length < 10) result.push(null);
        return result.slice(0, 10);
      };
      // 在用户点击表情后更新最近使用的表情
      const updateRecent = function (event) {
        const face = getFace(event.target);
        if (!face) return;
        const recent = [face].concat(rule.ref.recent.getConfig());
        rule.ref.recent.setConfig(removeDuplicate(recent));
        renderRecentList();
      };
      /**
       * 使用拖拽置顶表情
       * @param {HTMLElement} container
       * @param {HTMLUListElement} ul
       */
      const dragFace = function (container, ul) {
        // 显示和隐藏提示拖拽的标语
        const notice = container.querySelector('.yawf-face-drop-area');
        const showNotice = function () { notice.style.display = 'block'; };
        const hideNotice = function () { notice.style.display = 'none'; };
        // 拖拽
        let dragging = null, listItems;
        container.addEventListener('dragstart', event => {
          dragging = getFace(event.target) || null;
          // 开始拖拽的时候，标记所有目的地为可编辑的
          listItems = Array.from(ul.childNodes);
          listItems.forEach(li => { li.setAttribute('contenteditable', 'true'); });
          showNotice();
        });
        container.addEventListener('mouseleave', () => { dragging = null; });
        notice.addEventListener('dragenter', () => { hideNotice(); });
        ul.addEventListener('dragenter', () => { hideNotice(); });
        container.addEventListener('dragend', () => { hideNotice(); });
        container.addEventListener('drop', event => {
          // 结束拖拽的时候恢复原样
          if (listItems) listItems.forEach(li => { li.removeAttribute('contenteditable'); }); listItems = null;
          const img_upload = document.querySelector('.send_weibo .img_upload');
          if (img_upload) img_upload.style.display = 'none';
          // 然后看看起止都在哪里
          if (dragging === null) return;
          event.preventDefault();
          event.stopPropagation();
          const current = event.target.closest('li');
          const index = Array.from(ul.childNodes).indexOf(current);
          // 把拽到的东西加到置顶里面去
          const list = rule.ref.top.getConfig(), old = list[index];
          const newList = list.map((face, i) => {
            if (i === index) return dragging;
            if (!face) return null;
            if (face.title === dragging.title) return old;
            return face;
          });
          rule.ref.top.setConfig(newList);
          renderTopList();
        });
        if (rule.ref.top.getConfig().some(e => e)) hideNotice();
      };
      // 监视新的表情框
      observer.dom.add(function faceFastObserver() {
        const tab = document.querySelector('.layer_faces:not([node-type="huati_tabs"]) .WB_minitab:first-child');
        if (!tab) return;
        const container = tab.parentNode;
        const wrap = document.createElement('div');
        wrap.innerHTML = '<div class="faces_list yawf-face-list" node-type="scrollView"><div class="yawf-face-top yawf-face-row" node-type="list"><span class="yawf-face-title"></span><ul class="yawf-face-items"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul><span class="yawf-face-drop-area"></span></div><div class="yawf-face-recent yawf-face-row" node-type="list"><span class="yawf-face-title"></span><ul class="yawf-face-items"><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li></ul></div></div>';
        const area = container.insertBefore(wrap.firstChild, tab);
        area.querySelector('.yawf-face-top span').textContent = i18n.fastFaceTop;
        area.querySelector('.yawf-face-drop-area').textContent = i18n.fastFaceTopNotice;
        area.querySelector('.yawf-face-recent span').textContent = i18n.fastFaceRecent;
        const topList = area.querySelector('.yawf-face-top ul');
        const recentList = area.querySelector('.yawf-face-recent ul');
        const chatListNode = container.querySelector('ul[node-type="_phizListNode"]');
        const isIm = chatListNode != null;
        container.addEventListener('click', updateRecent);
        dragFace(container, topList);
        if (isIm) {
          area.classList.add('yawf-face-im');
          fixChat([topList, recentList], chatListNode);
        }
        renderTopList();
        renderRecentList();
      });
      // 修理一下聊天窗口里面的情况
      // 我不确定这段代码还有没有用，总之先留着
      const fixChat = function (lists, chatListNode) {
        lists.forEach(list => {
          list.addEventListener('click', event => {
            event.stopPropagation();
            const target = event.target.closest('li');
            if (!target.title) return;
            // 弄一个假的按钮，放在原本的列表末尾，骗他说我点的是原本的列表里面的
            const fake = target.cloneNode(true);
            fake.style.display = 'none';
            chatListNode.appendChild(fake);
            fake.click();
            fake.parentNode.removeChild(fake);
          });
        });
      };
      css.append(`
.layer_faces .faces_list.yawf-face-list { height: 79px; }
.yawf-face-row { display: block; height: 32px; margin: 0 0 5px; }
.yawf-face-title { float: left; font-weight: bold; line-height: 32px; padding: 0; text-align: center; width: 52px; margin: 0 -8px 0 0; }
.yawf-face-items { float: right; margin: 0 8px; }
.yawf-face-items li { color: transparent; }
.yawf-face-drop-area { background: rgba(255, 255, 127, 0.5); clear: both; float: right; font-weight: bold; height: 36px; line-height: 36px; margin: -36px 8px 0; opacity: 1; padding: 0; width: 348px; text-align: center; }
.layer_faces .faces_list { -webkit-user-select: none; -moz-user-select: none; user-select: none; }
.layer_faces .faces_list li { overflow: hidden; }
.layer_faces .faces_list img { border: 10px transparent solid; margin: -10px; }
`);
    },
  });

  if (env.config.requestBlockingSupported) {
    Object.assign(i18n, {
      topicCompleteWithout: {
        cn: '在话题自动完成时不包括||{{place}}地点|{{movie}}电影|{{book}}图书|{{topic}}超话|{{music}}音乐|{{stock}}股票',
        tw: '在話題自動完成時不包括||{{place}}地點|{{movie}}電影|{{book}}圖書|{{topic}}超話|{{music}}音樂|{{stock}}股票',
        en: 'Exclude following items from topic auto complete||{{place}} place|{{movie}} movie|{{book}} book||{{topic}} super topic|{{music}} music|{{stock}} stock',
      },
    });

    details.topicCompleteWithout = rule.Rule({
      id: 'layout_topic_without',
      version: 30,
      parent: details.details,
      template: () => i18n.topicCompleteWithout,
      ref: Object.assign({}, ...['place', 'movie', 'book', 'topic', 'music', 'stock'].map(type => ({
        [type]: { type: 'boolean', initial: true },
      }))),
      init() {
        backend.onRequest('topic', async details => {
          if (!this.isEnabled()) return {};
          const hideItems = ['place', 'movie', 'book', 'topic', 'music', 'stock'].filter(type => {
            return this.ref[type].getConfig();
          });
          await backend.topicFilter(details, hideItems);
          return {};
        });
      },
    });
  }

  Object.assign(i18n, {
    useLocaleTimezone: {
      cn: '使用本机时区',
      tw: '使用本機時區',
      en: 'Use locale timezone',
    },
    feedsRead: { cn: '你看到这里', tw: '你看到這裡', en: 'you got here' },
  });

  // 使用本地时区
  details.timezone = rule.Rule({
    id: 'layout_locale_timezone',
    version: 1,
    parent: details.details,
    template: () => i18n.useLocaleTimezone,
    hidden: time.isCstEquivalent(),
    init() {

      const useLocale = this.isEnabled();
      const feedUseYear = yawf.rules.feeds.details.feedAbsoluteTime.isEnabled();

      if (!useLocale && !feedUseYear) return;

      const updateDate = function (element) {
        const date = parseInt(element.getAttribute('yawf-date'), 10);
        const format = element.getAttribute('yawf-date-format') || null;
        const locale = useLocale ? 'current' : 'cst';
        const formatTimeResult = util.time.format(date, { format, locale });
        if (element.textContent !== formatTimeResult) {
          element.textContent = formatTimeResult;
        }
        if (useLocale) {
          const formatTimeDetailResult = util.time.format(date, { format: 'full', locale: 'current' });
          if (element.title !== formatTimeDetailResult) {
            element.title = formatTimeDetailResult;
          }
        }
      };

      const updateAllDate = function () {
        const dates = document.querySelectorAll('[yawf-date]');
        Array.from(dates).forEach(element => {
          updateDate(element);
        });
      };

      if (useLocale) {
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

        observer.dom.add(handleDateElements);

        // 处理文本显示的时间
        const handleTextDateElements = function changeDateText() {
          const selectors = [
            '.WB_from:not([yawf-localtime])',
            '.cont_top .data:not([yawf-localtime])',
            'legend:not([yawf-localtime])',
            '.layer_dialogue_v5 .time_s p',
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
            const time = util.time.parse(match);
            if (!time) return;
            util.debug('parse time %o(%s) to %o(%s)', textNode, text, time, time);
            textNode.textContent = tail ? ` ${tail} ` : '';
            const timeElement = document.createElement('span');
            timeElement.setAttribute('yawf-date', +time);
            updateDate(timeElement);
            textNode.replaceWith(timeElement);
          });
        };
        observer.dom.add(handleTextDateElements);
      }

      if (feedUseYear) {
        observer.feed.onAfter(function (feed) {
          const dates = feedParser.date.dom(feed);
          dates.forEach(element => {
            if (element.getAttribute('date')) {
              const date = parseInt(element.getAttribute('date'), 10);
              element.setAttribute('yawf-date', date);
              element.removeAttribute('date');
            }
            element.setAttribute('yawf-date-format', 'year');
            updateDate(element);
          });
        });
      }

      setInterval(updateAllDate, 1e3);

      css.append(`
.WB_feed_v3 .WB_from span[yawf-date] { margin-left: 0; }
[yawf-date]::after { content: " "; }
`);
    },
  });

  if (env.config.chatInPageSupported) {

    Object.assign(i18n, {
      chatInPage: {
        cn: '在微博页面内整合聊天窗口',
        tw: '在微博頁面內整合聊天窗口',
        en: 'Use chat in pages of feeds',
      },
      chatButtonText: {
        // 这个条目没有翻译，因为这个只是在微博的初始化之前用的
        // 微博初始化之后会用微博自己的，那个就没有翻译
        cn: '微博聊天',
      },
    });

    details.chatFrame = rule.Rule({
      id: 'layout_chat_in_page',
      version: 1,
      parent: details.details,
      template: () => i18n.chatInPage,
      ref: {
        width: { initial: 640, min: 640 },
        height: { initial: 480, min: 480 },
      },
      ainit() {
        const rule = this;
        css.append(`
#WB_webchat { bottom: -100px !important; display: block !important; }
#yawf-webchat { position: fixed; bottom: 0px; right: 0px; z-index: 1024; display: block !important; background: #d3d6df; }
#yawf-webchat .webim_fold { top: -40px; right: 0px; visibility: visible; }
#yawf-webchat .fold_cont em { width: 200px; display: inline-block; height: 40px; }
.yawf-webim-main { position: fixed; bottom: 0; right: 0; z-index: 10000; box-shadow: 0 0 10px black; border-radius: 3px 0 0 0; overflow: hidden; }
.yawf-webim-main iframe { width: 100%; height: 100%; border: 0 none; }
.yawf-webim-resizer { position: absolute; width: 12px; height: 12px; left: 0; top: 0; margin: 0; cursor: nwse-resize; opacity: 0.8; }
.yawf-webim-resizer i, .yawf-webim-resizer::after { content: " "; position: absolute; width: 12px; height: 12px; }
.yawf-webim-resizer i { transform: rotate(180deg); overflow: hidden; resize: both; }
.yawf-webim-resize .yawf-webim-resizer { width: 100%; height: 100%; }
`);

        let showChatWindow = null;
        let frameContentResolve;
        /** @type {Promise<Window>} */
        let frameContent = new Promise(resolve => { frameContentResolve = resolve; });
        const initChatArea = function (ori) {
          const container = document.createElement('div');
          container.innerHTML = '<div class="WB_webim" id="yawf-webchat" style=""><div class="webim_fold webim_fold_v2 clearfix"><div class="fold_bg"></div><p class="fold_cont clearfix"><span class="fold_icon W_fl" data-target="minichat"></span><em class="fold_font W_fl W_f14"></em></p></div><div class="yawf-webim-main" style="width: 640px; height: 480px;"><iframe src="https://chat.221edc3f-9e16-4973-a522-4ca21e7c8540.invalid/"></iframe><div class="yawf-webim-resizer"><i></i></div></div></div>';
          const webim = container.firstElementChild;
          const fold = webim.querySelector('.webim_fold');
          const main = webim.querySelector('.yawf-webim-main');
          const frame = webim.querySelector('iframe');
          const resizer = webim.querySelector('.yawf-webim-resizer');
          const mainContainer = main.parentNode;
          mainContainer.removeChild(main);
          let folded = true;
          showChatWindow = function () {
            if (main.parentNode !== mainContainer) {
              mainContainer.appendChild(main);
            }
            main.style.display = 'block';
            fold.style.display = 'none';
            folded = false;
          };
          fold.addEventListener('click', () => {
            showChatWindow();
          });
          document.addEventListener('click', event => {
            if (folded) return;
            if (webim.contains(event.target)) return;
            main.style.display = 'none';
            fold.style.display = 'block';
            folded = true;
          });
          frame.addEventListener('load', () => {
            const contentWindow = frame.contentWindow;
            frameContentResolve(contentWindow);
          });

          // 未读消息数量在原版的聊天按钮上的展示，我们把它拷贝过来
          const foldText = webim.querySelector('.fold_cont em');
          const oriText = ori.querySelector('.fold_cont em');
          const updateText = function () {
            foldText.textContent = oriText.textContent;
          };
          (new MutationObserver(updateText)).observe(oriText, { childList: true });
          foldText.textContent = i18n.chatButtonText;

          /*
           * 接下来允许聊天框缩放
           */
          let dragStartPos = [], dragStartSize = [];
          const setSize = function (width, height) {
            let targetW = null, targetH = null;
            if (width != null) {
              targetW = Math.max(640, Math.min(window.innerWidth, width));
              main.style.width = targetW + 'px';
            }
            if (height != null) {
              targetH = Math.max(480, Math.min(window.innerHeight - 48, height));
              main.style.height = targetH + 'px';
            }
            return [targetW, targetH];
          };
          const calcSize = function (clientX, clientY) {
            const [startX, startY] = dragStartPos;
            const [startW, startH] = dragStartSize;
            const width = startX - clientX + startW;
            const height = startY - clientY + startH;
            return setSize(width, height);
          };
          const dragMove = function (event) {
            calcSize(event.clientX, event.clientY);
          };
          const dragCancel = function (event) {
            calcSize(event.clientX, event.clientY);
          };
          const dragEnd = function (event) {
            const [width, height] = calcSize(event.clientX, event.clientY);
            rule.ref.width.setConfig(width);
            rule.ref.height.setConfig(height);
            document.body.classList.remove('yawf-webim-resize');
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseleave', dragCancel);
            document.removeEventListener('mouseup', dragEnd);
          };
          const dragStart = function (event) {
            dragStartPos = [event.clientX, event.clientY];
            dragStartSize = [main.clientWidth, main.clientHeight];
            document.body.classList.add('yawf-webim-resize');
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseleave', dragCancel);
            document.addEventListener('mouseup', dragEnd);
          };
          rule.ref.width.addConfigListener(newWidth => {
            setSize(newWidth, null);
          });
          rule.ref.height.addConfigListener(newHeight => {
            setSize(null, newHeight);
          });
          resizer.addEventListener('mousedown', dragStart);
          setSize(rule.ref.width.getConfig(), rule.ref.height.getConfig());
          window.addEventListener('resize', () => {
            setSize(main.clientWidth, main.clientHeight);
          });

          document.body.appendChild(webim);
        };

        observer.dom.add(function checkImArea() {
          const webim = document.querySelector('#WB_webchat:not([yawf-web-chat])');
          if (!webim) return;
          webim.setAttribute('yawf-web-chat', '');
          initChatArea(webim);
        });

        /*
         * 这一段是让“聊天”/“私信”按钮可以激活聊天框并切换到对应的人
         */

        const chatToUid = function (uid) {
          frameContent.then(contentWindow => {
            chatframe.chatToUid(uid);
          });
        };

        document.addEventListener('click', event => {
          if (!showChatWindow) return;
          const target = event.target;
          if (!(target instanceof Element)) return;
          const uid = (function () {
            const chatTo = target.closest('a[href*="api.weibo.com/chat"]');
            if (!chatTo) return null;
            const data = new URL(chatTo.hash.slice(1), location.href);
            const uid = Number(data.searchParams.get('to_uid'));
            if (!uid) return null;
            return uid;
          }()) || (function () {
            const toDialog = target.closest('[action-type="to_dialog"]');
            if (!toDialog) return null;
            const data = new URLSearchParams(toDialog.getAttribute('action-data'));
            const uid = Number(data.get('uid'));
            if (!uid) return null;
            return uid;
          }());
          if (!uid) return;
          event.stopPropagation();
          event.preventDefault();
          showChatWindow();
          chatToUid(uid);
        }, true);

      },
    });

  }

  i18n.hideHotTopicLargeRead = {
    cn: '隐藏热门话题中|阅读数量超过{{quota}}亿的话题',
    tw: '隱藏熱門話題中|閱讀數量超過{{quota}}億的話題',
    en: 'Hide Topics in Hot Topics | with {{quota}}00 million reading counts',
  };

  layout.hideHotTopicLargeRead = rule.Rule({
    id: 'hide_hot_topic_large_read',
    version: 65,
    parent: details.details,
    template: () => i18n.hideHotTopicLargeRead,
    ref: {
      quota: {
        type: 'range',
        min: 1,
        max: 100,
        initial: 20,
      },
    },
    async ainit() {
      util.css.add('.hot_topic li[yawf-rtopic-count="hidden"], #topicAD { display: none !important; }');
      let that = this;
      observer.dom.add(function filteRightTopicCount() {
        let counts = Array.from(document.querySelectorAll('.hot_topic li:not([yawf-rtopic-count]) .total'));
        counts.forEach(function (count) {
          // 网站中数字由 xxx万 ， xx.x亿 的方式表示；且没有繁体或英文版本
          // 注意有时前面的数字会有小数点，所以要替换为 e4, e8 而非 0000, 00000000
          const number = strings.parseint(count.textContent);
          const li = count.closest('li');
          if (Number.isNaN(number) || that.ref.quota.getConfig() * 1e8 <= number) {
            li.setAttribute('yawf-rtopic-count', 'hidden');
          } else {
            li.setAttribute('yawf-rtopic-count', 'show');
          }
        });
      });
    },
  });


}());
