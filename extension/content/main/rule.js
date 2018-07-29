; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const ui = util.ui;
  const i18n = util.i18n;

  const rule = yawf.rule = yawf.rule || {};

  i18n.configDialogTitle = {
    cn: '设置 - 药方 (YAWF)',
    tw: '設定 - 藥方 (YAWF)',
    en: 'Settings - Yet Another Weibo Filter (YAWF)',
  };

  rule.dialog = function () {
    ui.alert({
      id: 'yawf-config',
      title: i18n.configDialogTitle,
      text: 'stub',
    });
  };

}());
