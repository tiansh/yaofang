; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  let language = util.language = null;
  const i18n = new Proxy(Object.create(null), {
    get: (self, key) => {
      if (!language) return null;
      return (self[key] || {})[language] || null;
    },
    set: (self, key, value) => {
      const entry = self[key] = {};
      entry.cn = value.cn;
      entry.tw = value.tw || entry.cn;
      entry.hk = value.hk || entry.tw;
      entry.en = value.en || entry.cn;
      return true;
    },
  });

  i18n.language = {
    en: 'en',
    cn: 'cn',
    hk: 'hk',
    tw: 'tw',
  };
  i18n.languageCode = {
    en: 'en',
    cn: 'zh-CN',
    hk: 'zh-HK',
    tw: 'zh-TW',
  };

  Object.defineProperty(util, 'i18n', {
    get: () => i18n,
    set: lang => {
      const lower = ('' + lang).toLowerCase();
      if (lower === 'zh-cn') language = 'cn';
      else if (lower === 'zh-hk') language = 'hk';
      else if (lower === 'zh-tw') language = 'tw';
      else if (lower === 'en') language = 'en';
      else return false;
      util.language = language;
      return true;
    },
  });

}());
