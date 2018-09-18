; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const style = yawf.rules.style;

  const i18n = util.i18n;
  const css = util.css;

  const text = style.text = {};

  i18n.styleTextGroupTitle = {
    cn: '文字',
    en: 'Text',
  };

  text.text = rule.Group({
    parent: style.style,
    template: () => i18n.styleTextGroupTitle,
  });

  i18n.styleTextFontSize = {
    cn: '增大微博正文字号为|原大小的{{ratio}}',
    tw: '加大微博內文字體為|原大小的{{ratio}}',
    en: 'Increase font size for weibo content | to {{ratio}}',
  };

  text.size = rule.Rule({
    id: 'feed_font_size',
    parent: text.text,
    template: () => i18n.styleTextFontSize,
    ref: {
      ratio: {
        type: 'select',
        select: [
          { value: '120', text: '120%' },
          { value: '150', text: '150%' },
          { value: '200', text: '200%' },
          { value: '300', text: '300%' },
        ],
      },
    },
    ainit() {
      const { fs, lh, fs2, lh2, h, h2, fs3 } = {
        '120': { fs: 16, lh: 26, fs2: 14, lh2: 24, h: 20, h2: 18, fs3: 12 },
        '150': { fs: 21, lh: 32, fs2: 18, lh2: 27, h: 25, h2: 23, fs3: 14 },
        '200': { fs: 28, lh: 42, fs2: 24, lh2: 36, h: 33, h2: 29, fs3: 19 },
        '300': { fs: 42, lh: 64, fs2: 36, lh2: 54, h: 50, h2: 46, fs3: 28 },
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
      css.add(style);
    },
  });

}());
