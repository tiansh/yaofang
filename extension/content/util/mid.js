; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const base62 = util.base62 = {};

  const base62Dict = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  base62.decode = function (str) {
    return [...str].reduce((prev, ch) => {
      return prev * 62 + base62Dict.indexOf(ch);
    }, 0);
  };

  base62.encode = function toString(num) {
    if (num === 0) return '0';
    if (num < 62) return base62Dict[num];
    return toString(Math.floor(num / 62)) + base62Dict[num % 62];
  };

  const mid = util.mid = {};

  mid.encode = function (base10mid) {
    return base10mid.match(/.{1,7}(?=(?:.{7})*$)/g)
      .map(trunc => base62.encode(Number(trunc)).padStart(4, 0))
      .join('').replace(/^0+/, '');
  };

  mid.decode = function (base62mid) {
    return base62mid.match(/.{1,4}(?=(?:.{4})*$)/g)
      .map(trunc => String(base62.decode(trunc)).padStart(7, 0))
      .join('').replace(/^0+/, '');
  };

}());
