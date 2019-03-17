; (async function () {

  const yawf = window.yawf;
  const util = yawf.util = yawf.util || {};

  const strings = util.strings = {};

  /**
   * 将微博中带有“万”或“亿”的字串转换为数字
   * 微博的“万”“亿”没有针对不同语言做处理，繁体字和英文用户也会看到这两个字
   * @param {string} str
   * @returns {number}
   */
  strings.parseint = str => {
    return Number(str.replace('万', 'e4').replace('亿', 'e8'));
  };

  /**
   * 生成一个随机字符串
   * @returns {string}
   */
  strings.randKey = () => {
    const rand = new Uint8Array(64);
    crypto.getRandomValues(rand);
    return [...rand].map(value => value.toString(16).padStart(2, 0)).join('');
  };

}());
