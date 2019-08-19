; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const keyboard = util.keyboard;
  const css = util.css;

  const reading = feeds.reading = {};

  i18n.feedReadingGroupTitle = {
    cn: '阅读视图',
    tw: '閱讀視圖',
    en: 'Reading View',
  };

  reading.reading = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedReadingGroupTitle,
  });

  i18n.feedOnlyMode = {
    cn: '阅读视图|宽度{{width}}像素||快捷键{{key}}||{{button}}在微博列表顶部显示快捷开关按钮',
    tw: '閱讀視圖|寬度{{width}}圖元||快速鍵{{key}}||{{button}}在微博清單頂部顯示快速開關按鈕',
    en: 'Reading Mode | width {{width}}px || shortcut {{key}} || {{button}} show switch button at top of Weibo list',
  };
  i18n.feedOnlySwitch = {
    cn: '切换阅读视图',
    tw: '切換閱讀視圖',
    en: 'Toggle Reading Mode',
  };

  reading.feedOnlyMode = rule.Rule({
    id: 'feed_only_mode',
    version: 1,
    parent: reading.reading,
    template: () => i18n.feedOnlyMode,
    ref: {
      width: { type: 'range', min: 480, max: 1280, initial: 600, step: 10 },
      key: { type: 'key', initial: keyboard.code.F8 },
      button: { type: 'boolean', default: false },
      _enabled: { type: 'boolean', initial: false },
    },
    ainit() {
      const rule = this;

      if (rule.ref.button.getConfig()) {
        const showButton = function showReaderSwitch() {
          const tabFirst = document.querySelector([
            '#v6_pl_content_homefeed .WB_tab_a:not([yawf-feed-only-added])',
            'div[id^="Pl_Official_ProfileFeedNav__"] .WB_tab_a:not([yawf-feed-only-added])',
          ].join(','));
          if (!tabFirst) return;
          tabFirst.setAttribute('yawf-feed-only-added', '');
          const wrap = document.createElement('div');
          wrap.innerHTML = '<div class="yawf-feed-only-button S_bg2"><a class="S_txt1"></a></div>';
          const line = wrap.firstChild;
          const button = line.querySelector('a');
          button.textContent = i18n.feedOnlySwitch;
          tabFirst.parentNode.insertBefore(line, tabFirst);
          button.addEventListener('click', event => {
            if (!event.isTrusted) return;
            rule.ref._enabled.setConfig(!rule.ref._enabled.getConfig());
          });
        };
        observer.dom.add(showButton);
      }

      document.addEventListener('keydown', event => {
        if (!event.isTrusted) return;
        if (event.target.matches('input, textarea, select')) return;
        const code = keyboard.event(event);
        if (code !== rule.ref.key.getConfig()) return;
        rule.ref._enabled.setConfig(!rule.ref._enabled.getConfig());
      });

      const width = rule.ref.width.getConfig();
      css.append(`
.yawf-feed-only-button { text-align: center; line-height: 31px; margin-bottom: 10px; border-radius: 3px; }
body[yawf-feed-only][yawf-feed-only] { --yawf-left-width: 0px; --yawf-right-width: 0px; --yawf-feed-width: ${+width}px; --yawf-extra-padding: 20px;}
body[yawf-feed-only] .WB_miniblog { padding-top: 50px; }
body[yawf-feed-only] #WB_webchat,
body[yawf-feed-only] [i-am-music-player],
body[yawf-feed-only] .WB_frame>*:not(#plc_main),
body[yawf-feed-only] #plc_main>*:not(.WB_main_c):not(.WB_frame_c):not(.WB_main_r):not(.WB_frame_b),
body[yawf-feed-only] .WB_main_c>*:not(#v6_pl_content_homefeed),
body[yawf-feed-only] #plc_bot .WB_footer,
body[yawf-feed-only] #plc_bot .W_fold,
body[yawf-feed-only] .WB_footer { display: none !important; }
body[yawf-feed-only] .WB_frame { width: calc(var(--yawf-feed-width) + 20px) !important; }
body[yawf-feed-only] #plc_main { display: block; margin-left: auto; margin-right: auto; }
body[yawf-feed-only] .WB_frame,
body[yawf-feed-only] #plc_main,
body[yawf-feed-only] .WB_global_nav,
body[yawf-feed-only] .WB_main_c { max-width: 100%; margin: 0 auto; }
body[yawf-feed-only] #plc_main { padding-bottom: 10px; }
body[yawf-feed-only] #plc_main::after { content: " "; display: table; clear: both; }
body[yawf-feed-only] .WB_global_nav { position: static; margin-top: -50px; }
body[yawf-feed-only] #plc_main>.WB_main_r { visibility: hidden; margin-right: -230px; }
body[yawf-feed-only] #plc_main>.WB_frame_b { visibility: hidden; margin-right: -300px; }
body[yawf-feed-only] .WB_frame { padding-left: 0; }
`);

      const updateEnable = function (enabled) {
        if (enabled) document.body.setAttribute('yawf-feed-only', 'yawf-feed-only');
        else document.body.removeAttribute('yawf-feed-only');
      };
      rule.ref._enabled.addConfigListener(updateEnable);
      updateEnable(rule.ref._enabled.getConfig());
    },
  });

}());
