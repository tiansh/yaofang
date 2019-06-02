; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const download = yawf.download;
  const init = yawf.init;
  const importer = yawf.importer;

  const ui = util.ui;
  const css = util.css;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.backupGroupTitle = {
    cn: '导入 / 导出',
    tw: '匯入 / 匯出',
    en: 'Import / Export',
  };

  const backup = about.backup = {};
  backup.backup = rule.Group({
    parent: about.about,
    template: () => i18n.backupGroupTitle,
  });

  i18n.backupText = {
    cn: '备份和恢复设置（暂不支持导入脚本版设置）||{{buttons}}',
    tw: '備份和恢復設定（暫不支持匯入腳本版設定）||{{buttons}}',
    en: 'Backup and Recovery (Cannot load settings from script version)||{{buttons}}',
  };

  Object.assign(i18n, {
    configImportButton: { cn: '导入', tw: '匯入', en: 'Import' },
    configImportWarningTitle: { cn: '设置导入', tw: '設定匯入', en: 'Setting Import' },
    configImportWarning: {
      cn: '导入的设置会覆盖您当前已有的设置，确实要导入设置吗？',
      tw: '匯入的設定會覆蓋您當前已有的設定，您確定要匯入設定嗎？',
      en: 'The imported settings may replace your current settings. Are you sure you want to import this file?',
    },
    configImportWarningExternal: {
      cn: '您正在导入来自“{}”的设置，导入工具会尽量将您的设置转换为本扩展支持的功能，但实际效果仍会有所不同。导入后建议您打开扩展的设置复查各项设置。导入的设置会覆盖您当前已有的设置，确实要导入设置吗？',
      tw: '您正試圖匯入來自於「{}」的設定，匯入工具會盡可能將您的設定轉換為本擴充套件支援的功能，但實際效果仍會有所不同。執行匯入後，建議您打開設定方塊手工複查。匯入的設定會覆蓋您當前已有的設定，您確定要匯入設定嗎？',
      en: 'You are trying to import settings from "{}". Importing tool will try its best to convert your settings to what this extension supported. And due to the limitation, some features may not work as your expect. Remeber to recheck the settings after importing. The imported settings may replace your current settings. Are you sure you want to import this file?',
    },
    configImportSuccessTitle: { cn: '设置导入完成', tw: '設定匯入完成', en: 'Import settings completed' },
    configImportSuccess: { cn: '已经成功地导入了设置', tw: '已经成功地匯入了設定', en: 'Successfully imported settings' },
    configImportFailTitle: { cn: '设置导入失败', tw: '設定匯入失败', en: 'Import settings failed' },
    configImportFail: {
      cn: '导入设置文件时出现错误，可能是使用了错误的文件，文件已损坏或文件的版本不支持',
      tw: '匯入設定檔案時出現錯誤，可能是使用了錯誤的檔案，檔案已損壞或為不支援的版本',
      en: 'Error occurred during importing process. Wrong file may be used, the file may be broken, or the version of setting file is not supported.',
    },
    configExportButton: { cn: '导出', tw: '匯出', en: 'Export' },
    configResetButton: { cn: '重置', tw: '重設', en: 'Reset' },
    configResetWarningTitle: { cn: '设置重置', tw: '設定重設', en: 'Setting Reset' },
    configResetWarning: {
      cn: '这将会清空您当前的所有配置，之前检查和备份的关注列表、手动隐藏的微博编号等不会受到影响。确实要重置设置吗？',
      tw: '這將會清空您當前的所有設定，之前檢查和備份的關注清單、手動隱藏的微博編號等不會受到影響。您確定要重置設定嗎？',
      en: 'You are deleting all your settings. Following list, feeds hidden manually will be kept as is. Are you sure you want to reset your settings?',
    },
    configFilename: {
      cn: '药方设置',
      tw: '藥方設定',
      en: 'yaofang-config',
    },
    configImportWbpButton: {
      cn: '从“眼不见心不烦”导入',
      tw: '從「眼不見心不煩」匯入',
      en: 'Import from "眼不见心不烦"',
    },
  });

  let wbpConfig = null;

  backup.importExport = rule.Rule({
    id: 'script_import_export',
    version: 1,
    parent: backup.backup,
    render() {
      const rule = this;
      const container = document.createElement('span');
      container.className = 'yawf-config-item yawf-config-rule';
      container.innerHTML = '<label><input type="file" style=" width: 1px; height: 1px; margin: 0 -1px 0 0; opacity: 0;" /><span class="W_btn_b yawf-import" style="cursor: pointer"><span class="W_f14"></span></span></label><a class="W_btn_b yawf-export" href="javascript:;"><span class="W_f14"></span></a><a class="W_btn_b yawf-reset" href="javascript:;"><span class="W_f14"></span></a>';
      const importInput = container.querySelector('input');
      const importButton = container.querySelector('.yawf-import');
      const exportButton = container.querySelector('.yawf-export');
      const resetButton = container.querySelector('.yawf-reset');
      importButton.querySelector('.W_f14').textContent = i18n.configImportButton;
      exportButton.querySelector('.W_f14').textContent = i18n.configExportButton;
      resetButton.querySelector('.W_f14').textContent = i18n.configResetButton;
      const readFile = async function (file) {
        if (file.size > (1 << 24)) throw new RangeError();
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.addEventListener('load', () => {
            resolve(reader.result);
          });
          reader.readAsArrayBuffer(file);
        });
      };
      const importData = async function ({ config, source }) {
        if (!config) {
          ui.alert({
            id: 'yawf-import-failed',
            title: i18n.configImportFailTitle,
            text: i18n.configImportFail,
          });
          return;
        }
        const confirmAnswer = await ui.confirm({
          id: 'yawf-import-confirm',
          title: i18n.configImportWarningTitle,
          text: source ?
            i18n.configImportWarningExternal.replace('{}', () => source) :
            i18n.configImportWarning,
        });
        if (!confirmAnswer) return;
        await rule.configPool.import(config);
        await ui.alert({
          id: 'yawf-import-success',
          title: i18n.configImportSuccessTitle,
          text: i18n.configImportSuccess,
        });
        about.update.whatsNew.execute();
      };
      importInput.addEventListener('change', async event => {
        const file = importInput.files[0];
        importInput.value = null;
        let config = null, source = null;
        try {
          const fileContent = await readFile(file);
          ({ config, source } = importer.parse(fileContent));
        } catch (e) {
          // 读取文件失败，在下面报错
        }
        importData({ config, source });
      });
      exportButton.addEventListener('click', event => {
        const config = rule.configPool.export();
        const { name, version } = browser.runtime.getManifest();
        const [major, minor, micro] = version.split('.');
        // 脚本版用的是 yawf, conf, ver，换一套键值可以区分版本以及避免被不支持的脚本版导入
        const data = {
          yaofang: name,
          version: { major, minor, micro },
          userAgent: navigator.userAgent,
          config,
        };
        const text = JSON.stringify(data, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const username = init.page.$CONFIG.nick;
        const date = new Date().toISOString().replace(/-|T.*/g, '');
        const filename = download.filename(`${username}-${i18n.configFilename}-${date}.json`);
        download.blob({ blob, filename });
      });
      resetButton.addEventListener('click', async event => {
        const confirmAnswer = await ui.confirm({
          id: 'yawf-reset-confirm',
          title: i18n.configResetWarningTitle,
          text: i18n.configResetWarning,
        });
        if (!confirmAnswer) return;
        await rule.configPool.reset();
        about.update.whatsNew.execute();
        location.reload();
      });
      if (wbpConfig) try {
        const wrap = document.createElement('div');
        wrap.innerHTML = '<a class="W_btn_b yawf-import-wbp" href="javascript:;"><span class="W_f14"></span></a>';
        const importWbpButton = wrap.querySelector('.yawf-import-wbp');
        importWbpButton.querySelector('.W_f14').textContent = i18n.configImportWbpButton;
        importWbpButton.addEventListener('click', event => {
          importData(wbpConfig);
        });
        container.append(...wrap.childNodes);
      } catch (e) {
        // 似乎不能导入，那就不管他了
      }
      return container;
    },
  });

  css.append(`
.yawf-export, .yawf-reset, .yawf-import-wbp { margin-left: 10px; }
`);

  (function () {
    document.addEventListener('wbpPost', function getData(event) {
      try {
        const data = JSON.parse(event.detail.slice(event.detail.indexOf('=') + 1));
        wbpConfig = importer.ybjxbfConvert(data);
      } catch (e) {
        // 可能是数据损坏，总之不管他
      }
    });
  }());

}());
