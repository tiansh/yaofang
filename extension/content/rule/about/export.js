; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const download = yawf.download;
  const init = yawf.init;

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
  });

  backup.importExport = rule.Rule({
    id: 'script_import_export',
    version: 1,
    parent: backup.backup,
    render() {
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
      importInput.addEventListener('change', async event => {
        const file = importInput.files[0];
        importInput.value = null;
        let config = null;
        try {
          if (file.size > (1 << 24)) throw new RangeError();
          const fileContent = await new Promise(resolve => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              resolve(reader.result);
            });
            reader.readAsText(file);
          });
          const data = JSON.parse(fileContent);
          if (!data.version || !data.yaofang || !data.config) throw RangeError();
          config = data.config;
        } catch (e) {
          // read failed
        }
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
          text: i18n.configImportWarning,
        });
        if (!confirmAnswer) return;
        this.configPool.import(config);
        ui.alert({
          id: 'yawf-import-success',
          title: i18n.configImportSuccessTitle,
          text: i18n.configImportSuccess,
        }).then(() => {
          // 显示新功能提示
          about.update.whatsNew.execute();
        });
      });
      exportButton.addEventListener('click', event => {
        const config = this.configPool.export();
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
        this.configPool.reset();
        about.update.whatsNew.execute();
      });
      return container;
    },
  });

  css.append(`
.yawf-export, .yawf-reset { margin-left: 10px; }
`);

}());
