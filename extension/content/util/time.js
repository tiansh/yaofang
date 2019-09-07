; (function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};

  const i18n = util.i18n;
  const time = util.time = {};

  Object.assign(i18n, {
    timeMonthDay: { cn: '{1}月{2}日 {3}:{4}', en: '{1}-{2} {3}:{4}' },
    timeToday: { cn: '今天', tw: '今天', en: 'Today' },
    timeMinuteBefore: { cn: '分钟前', tw: '分鐘前', en: ' mins ago' },
    timeSecondBefore: { cn: '秒前', tw: '秒前', en: ' secs ago' },
  });

  const timeToParts = (time, locale = true) => (
    new Date(time - new Date(time).getTimezoneOffset() * 6e4 * locale)
      .toISOString().match(/\d+/g)
  );

  time.parse = function (text) {
    let parseDate = null;
    const now = Date.now();
    const [cy, cm, cd] = timeToParts(now);
    if (/^\d+-\d+-\d+ \d+:\d+$/.test(text)) {
      const [y, m, d, h, u] = text.match(/\d+/g);
      parseDate = Date.UTC(y, m - 1, d, h, u) - 288e5;
    } else if (/^(?:\d+-\d+|\d+月\d+日)\s*\d+:\d+$/.test(text)) {
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

  const now = time.now = function () {
    return new Date(Date.now() - time.diff);
  };

  time.format = function (time, format) {
    const ref = now();
    const [iy, im, id, ih, iu] = timeToParts(time);
    const [ny, nm, nd, nh, nu] = timeToParts(ref);
    const diff = (ref - time) / 1e3;
    if (format === 'full') {
      return formatter.format(time);
    } else if (iy !== ny || format === 'year') {
      return `${iy}-${im}-${id} ${ih}:${iu}`;
    } else if (im !== nm || id !== nd || format === 'month') {
      return i18n.timeMonthDay.replace(/\{\d\}/g, n => [+im, +id, ih, iu][n[1] - 1]);
    } else if (ih !== nh && diff > 3600 || format === 'today') {
      return `${i18n.timeToday} ${ih}:${iu}`;
    } else if (diff > 50 || format === 'minute') {
      return Math.ceil(diff / 60) + i18n.timeMinuteBefore;
    } else {
      return Math.max(Math.ceil(diff / 10), 1) * 10 + i18n.timeSecondBefore;
    }
  };

  time.diff = 0;
  time.setDiff = function (diff) {
    time.diff = +diff || 0;
  };

}());
