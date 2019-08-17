; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const feedParser = yawf.feed;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.debugGroupTitle = {
    cn: '调试',
    tw: '偵錯',
    en: 'Debug',
  };

  const debug = about.debug = {};
  debug.debug = rule.Group({
    parent: about.about,
    template: () => i18n.debugGroupTitle,
  });

  i18n.debugText = {
    cn: '在控制台打印调试信息',
    tw: '在控制台列印偵錯訊息',
    en: 'Log debug info to console',
  };

  debug.enable = rule.Rule({
    id: 'script_enable_debug',
    version: 1,
    parent: debug.debug,
    template: () => i18n.debugText,
    ainit: function () {
      util.debug.setEnabled(this.isEnabled());
    },
  });

  i18n.debugRegex = {
    cn: '在控制台打印每条微博用于正则表达式匹配时识别的文字',
    hk: '在控制台列印每條微博用於正則表達式匹配時識別的文字',
    tw: '在控制台列印每條微博用於正規表示式匹配時識別的文字',
    en: 'Show recognized texts for regex rules of each feeds in console',
  };

  debug.regex = rule.Rule({
    id: 'script_debug_regex',
    version: 1,
    parent: debug.debug,
    template: () => i18n.debugRegex,
    ainit: function () {
      observer.feed.onBefore(function (feed) {
        const text = feedParser.text.detail(feed);
        const json = JSON.stringify(text).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
        console.log('%o\n%o', feed, json);
      });
    },
  });

}());
