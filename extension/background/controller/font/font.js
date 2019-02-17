/**
 * 列出所有支持的字体
 */
; (async function () {

  const yawf = window.yawf;
  const message = yawf.message;

  /**
   * @template T
   * @param {T & Function} f
   * @returns {T}
   */
  const once = function (f) {
    let executed = false, value = null;
    const name = f.name;
    const wrap = function (...args) {
      if (executed) return value;
      value = f(...args);
      f = null;
      executed = true;
      return value;
    };
    Object.defineProperty(wrap, 'name', { get: () => name });
    return wrap;
  };

  const textWidth = (function () {
    const fontsize = 14;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // https://bugzil.la/561361
    return function (fontname, text) {
      context.font = 'bold ' + fontsize + 'px ' + fontname;
      return context.measureText(text).width;
    };
  }());

  const sampleTextWidth = function (fontname) {
    const sampleText = 'The quick brown fox jumps over the lazy dog7531902468,.!-������Ƅt�����ӣ�������';
    return textWidth(fontname, sampleText);
  };

  const basicFonts = [
    'monospace', 'sans-serif', 'sans', 'Symbol', 'Arial', 'Fixed',
    'Times', 'Times New Roman', '宋体', '黑体', 'Microsoft YaHei',
  ];

  const setupBaseline = once(function () {
    return basicFonts.map(fontname => sampleTextWidth(fontname));
  });

  const checkFont = function (cssName) {
    const baseline = setupBaseline();
    return basicFonts.some((fontname, index) => (
      sampleTextWidth(`${cssName},${fontname}`) !== baseline[index]
    ));
  };

  const checkAllFonts = once(function () {
    const checklist = {
      west: [
        ['Times', 'Times'],
        ['"Times New Roman"', 'Times New Roman'],
        ['Georgia', 'Georgia'],
        ['Arial', 'Arial'],
        ['Helvetica', 'Helvetica'],
        ['Verdana', 'Verdana'],
        ['".SFNSDisplay-Regular"', 'San Francisco'],
      ],
      chinese: [
        ['"SimSun", "宋体"', '中易宋体'],
        ['"Heiti SC", "黑体-简"', '黑体-简'],
        ['"PingFang SC", "苹方-简"', '苹方-简'],
        ['"STHeiti", "华文黑体"', '华文黑体'],
        ['"Hiragino Sans GB", "冬青黑体简体中文"', '冬青黑体'],
        ['"Microsoft YaHei", "微软雅黑"', '微软雅黑'],
        ['"DengXian", "等线"', '等线'],
        ['"WenQuanYi Zen Hei", "文泉驿正黑"', '文泉驿正黑'],
        ['"WenQuanYi Micro Hei", "文泉驿微米黑"', '文泉驿微米黑'],
        ['"Noto Sans CJK SC", "Source Han Sans SC", "思源黑体 SC"', '思源黑体'],
        ['"Noto Serif CJK SC", "Source Han Serif SC", "思源宋体 SC"', '思源宋体'],
        ['"SimKai", "楷体"', '中易楷体'],
        ['"PMingLiU", "新細明體"', '新細明體'],
        ['"MingLiU", "細明體"', '細明體'],
        ['"Heiti TC", "黑體-繁"', '黑體-繁'],
        ['"PingFang TC", "蘋方-繁"', '蘋方-繁'],
        ['"PingFang HK", "蘋方-港"', '蘋方-港'],
        ['"LiHei Pro Medium", "儷黑 Pro"', '儷黑 Pro'],
        ['"Microsoft JhengHei", "微軟正黑體"', '微軟正黑體'],
        ['"Noto Sans CJK TC", "Source Han Sans TC", "思源黑體 TC"', '思源黑體'],
        ['"Noto Serif CJK TC", "Source Han Serif TC", "思源宋體 TC"', '思源宋體'],
        ['"DFKai-SB", "BiauKai", "標楷體"', '標楷體'],
      ],
    };
    Object.keys(checklist).forEach(key => {
      checklist[key] = checklist[key].filter(([cssName, name]) => checkFont(cssName));
    });
    return checklist;
  });

  const getSupportedFontList = once(function getSupportedFontList() {
    return checkAllFonts();
  });

  message.export(getSupportedFontList);

}());
