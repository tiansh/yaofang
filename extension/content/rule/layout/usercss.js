; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const externalMenu = yawf.externalMenu;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const ui = util.ui;

  const userCss = layout.userCss = {};

  i18n.userCssGroupTitle = {
    cn: '自定义 CSS 样式',
    tw: '自訂 CSS 式樣',
    en: 'Custom CSS',
  };

  userCss.userCss = rule.Group({
    parent: layout.layout,
    template: () => i18n.userCssGroupTitle,
  });

  Object.assign(i18n, {
    userCss: {
      cn: '使用自定义 CSS 样式 {{i}}||{{css}}',
      tw: '使用自訂 CSS 式樣 {{i}}||{{css}}',
      en: 'Apply Custom CSS {{i}}||{{css}}',
    },
    userCssDetail: {
      cn: '错误配置的自定义样式可能导致您的网页显示不正常，使用来源不明的 CSS 代码可能危害您的隐私安全。建议您仅添加您信任的 CSS 样式。如果您使用的样式导致设置窗口无法正常显示，' + (env.name === 'WebExtension' ? '您可以在标签页上右键找到禁用功能' : '您可以在“猴子”扩展的菜单中找到禁用功能') + '。',
      tw: '錯誤設定的自訂式樣可導致您的網頁不能正常顯示，使用來源不明的 CSS 程式碼可能威脅您的隱私安全。建議您僅添加您信任的 CSS 式樣。如果您使用的式樣導致設定方框無法正常顯示，' + (env.name === 'WebExtension' ? '您可以在索引標籤上按右鍵找到停用功能' : '您可以在「猴子」擴展的功能列中找到停用功能') + '。',
      en: 'Misconfigured custom CSS may make your web page being rendered incorrectly. Using CSS from untrusted source may harm your privacy. Make sure only adding CSS from you trusted source. In case custom CSS breaks this setting dialog, ' + (env.name === 'WebExtension' ? 'you may disable it from context menu of browser tab' : 'you may disable it from the menu item in "monkey" extension') + '.',
    },
    disableUserCss: {
      cn: '禁用自定义 CSS 样式',
      tw: '停用自訂 CSS 式樣',
      en: 'Disable Custom CSS',
    },
    disableUserCssText: {
      cn: '已禁用自定义 CSS 样式。如果您配置的自定义 CSS 样式导致界面出现任何问题，您可以在设置中选择启用后，删除导致问题的规则。',
      tw: '已停用自訂 CSS 式樣。如果您設定的自訂 CSS 式樣導致介面出現任何問題，您可以在這定中選擇啟用後，刪除導致問題的規則。',
      en: 'Custom CSS had been disabled. In case any custom CSS break the webpage, you may enable and then edit it in the setting dialog.',
    },
  });

  if (env.config.externalMenuSupported) {
    userCss.css = rule.Rule({
      weiboVersion: [6, 7],
      id: 'custom_css',
      version: 1,
      parent: userCss.userCss,
      template: () => i18n.userCss,
      initial: true,
      ref: {
        css: { type: 'text' },
        i: { type: 'bubble', icon: 'warn', template: () => i18n.userCssDetail },
      },
      afterRender(node) {
        const textarea = node.querySelector('textarea');
        const label = textarea.closest('label');
        if (!this.isEnabled()) label.style.display = 'none';
        this.addConfigListener(enabled => {
          if (enabled) {
            label.style.display = 'block';
            label.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            textarea.focus();
          } else {
            label.style.display = 'none';
          }
        });
        return node;
      },
      ainit() {
        const style = document.createElement('style');
        style.textContent = this.ref.css.getConfig();
        setTimeout(function addStyle() {
          // Tampermonkey BETA 处理 setTimeout 0 会真的 0，会卡死……
          // 虽然扩展版本不受影响，不过两边代码是共用的，所以这里改一下也不会有什么问题
          if (!document.body) setTimeout(addStyle, 16);
          else document.body.appendChild(style);
        }, 0);
        // 我们添加一个可以禁用这个功能的方式以防有用户把设置对话框给隐藏了或者弄乱了改不回去
        externalMenu.add({
          title: i18n.disableUserCss,
          callback: async () => {
            this.setConfig(false);
            style.textContent = '';
            await ui.alert({
              id: 'yawf-disable-user-css',
              icon: 'succ',
              title: i18n.disableUserCss,
              text: i18n.disableUserCssText,
            });
            location.reload();
          },
        });
      },
    });
  }

}());
