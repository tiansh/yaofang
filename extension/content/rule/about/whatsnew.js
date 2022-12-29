; (function () {

  const browser = window.weBrowser;
  const yawf = window.yawf;
  const init = yawf.init;
  const util = yawf.util;
  const rule = yawf.rule;

  const ui = util.ui;
  const css = util.css;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.updateGroupTitle = {
    cn: '更新',
    en: 'Update',
  };

  const update = about.update = {};
  update.update = rule.Group({
    parent: about.about,
    template: () => i18n.updateGroupTitle,
  });

  Object.assign(i18n, {
    showWhatsNew: { cn: '更新后显示新功能提示', tw: '更新後顯示新功能提示', en: 'Show new features after update' },
    installSuccessTitle: { cn: '药方 (YAWF) 安装成功', tw: '藥方 (YAWF) 安裝成功', en: 'YAWF Installation successes' },
    installSuccessTextV7: {
      cn: '感谢您安装药方 (YAWF) 扩展。您可以在右上角齿轮图标的菜单中找到药方的设置。目前对新版微博 V7 的支持有限，且部分功能随时可能出现问题。如果您发现任何问题或希望任何功能支持新版，您可以和 @YAWF脚本 反馈。药方 (YAWF) 是第三方工具，从未要求过付款使用或寻求过捐赠。',
    },
    updateSuccessTitle: { cn: '药方 (YAWF) 新功能提示', tw: '藥方 (YAWF) 新功能提示', en: "YAWF What's New" },
    updateSuccessHeader: { cn: '药方 (YAWF) 扩展已更新', tw: '藥方 (YAWF) 擴充套件已更新', en: 'Your YAWF extension has been updated' },
    updateSuccessDetail: { cn: '当前版本添加或更新了以下 {{count}} 项功能', tw: '當前版本添加或更新了以下 {{count}} 項功能', en: 'The current version has added or updated the following {{count}} feature(s)' },
  });

  update.whatsNew = rule.Rule({
    v7Support: true,
    id: 'script_update_whatsnew',
    version: 1,
    parent: update.update,
    initial: true,
    template: () => i18n.showWhatsNew,
    ref: {
      last: { type: 'number', initial: 0 },
      lastWeibo: { type: 'number', initial: 0 },
    },
    async init() {
      // 这个功能需要显示对话框
      // 对话框需要页面加载完成才能显示
      if (!['complete', 'loaded', 'interactive'].includes(document.readyState)) {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }
      const whatsNew = this;
      const currentVersion = Number(browser.runtime.getManifest().version.match(/\d+$/g));
      const lastVersion = this.ref.last.getConfig();
      const updateDone = () => { this.ref.last.setConfig(currentVersion); };
      if (!lastVersion && currentVersion) {
        // 初次运行
        ui.alert({
          id: 'yawf-first-seen',
          title: i18n.installSuccessTitle,
          text: i18n.installSuccessTextV7,
        }).then(() => {
          this.ref.last.setConfig(currentVersion);
        });
        return;
      } else if (currentVersion < lastVersion) {
        // 当前版本比历史版本更旧，可能是回退了版本，直接更新版本号
        updateDone();
        return;
      } else if (currentVersion === lastVersion) {
        return;
      } else if (!whatsNew.isEnabled()) {
        updateDone();
        return;
      }
      const ruleItems = rule.query({
        filter(item) {
          return item.version && item.version > lastVersion && item.version <= currentVersion;
        },
      });
      if (!ruleItems.length) {
        updateDone();
        return;
      }
      const whatsNewDialog = ui.dialog({
        id: 'yawf-whatsnew',
        title: i18n.updateSuccessTitle,
        render(container) {
          container.innerHTML = '<div class="yawf-whatsnew-dialog"><div class="yawf-whatsnew-header"></div><div class="yawf-whatsnew-body"></div><div class="yawf-whatsnew-footer"><hr /></div></div>';
          const header = container.querySelector('.yawf-whatsnew-header');
          const body = container.querySelector('.yawf-whatsnew-body');
          const footer = container.querySelector('.yawf-whatsnew-footer');
          header.textContent = i18n.updateSuccessHeader;
          body.textContent = i18n.updateSuccessDetail.replace('{{count}}', ruleItems.length);
          rule.render(body, ruleItems);
          footer.appendChild(whatsNew.render());
        },
        button: {
          close() {
            whatsNewDialog.hide();
            whatsNew.ref.last.setConfig(currentVersion);
          },
        },
      });
      if (init.page.type() === 'search') return;
      whatsNewDialog.show();
    },
  });

  css.append(`
.yawf-whatsnew-dialog { padding: 20px; width: 600px; } 
.yawf-whatsnew-header { font-size: 140%; }
.yawf-whatsnew-body { height: 300px; overflow: auto; margin: 0 -20px; padding: 0 20px; }
#yawf-whatsnew .woo-dialog-main { padding-bottom: 0; }
#yawf-whatsnew .woo-dialog-title { margin-bottom: 0; }
#yawf-whatsnew .woo-dialog-body { padding: 0; }
#yawf-whatsnew hr { border-color: var(--w-dividing-line); }
`);

}());
