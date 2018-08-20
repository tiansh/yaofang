
; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.aboutScriptGroupTitle = {
    cn: '关于',
    hk: '關於',
    tw: '關於',
    en: 'About',
  };

  const script = about.script = {};
  script.script = rule.Group({
    parent: about.about,
    template: () => i18n.aboutScriptGroupTitle,
  });

  i18n.aboutText = {
    cn: '当前扩展正在开发之中，如欲贡献代码请联系 {{scriptWeibo}}。',
    tw: '當前擴充套件正在開發，如慾參與編碼或翻譯工作請聯絡 {{scriptWeibo}}。',
    en: 'This extension is under construction. Please contact {{scriptWeibo}} if you want contribute coding or translations.',
  };

  script.text = rule.Text({
    parent: script.script,
    template: () => i18n.aboutText,
    ref: {
      scriptWeibo: {
        render() {
          const link = document.createElement('a');
          link.href = 'https://weibo.com/yawfscript';
          link.title = 'YAWF脚本';
          link.textContent = '@YAWF脚本';
          link.setAttribute('usercard', 'id=5601033111');
          return link;
        },
      },
    },
  });

}());
