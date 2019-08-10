; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const externalMenu = yawf.externalMenu;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;
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
      cn: '错误配置的自定义样式可能导致您的网页显示不正常，使用来源不明的 CSS 代码可能危害您的隐私安全。建议您仅添加您信任的 CSS 样式。如果您使用的样式导致设置窗口无法正常显示，您可以在猴子的菜单中找到禁用自定义 CSS 的选项。',
    },
    disableUserCss: {
      cn: '禁用自定义 CSS 样式',
      tw: '停用自訂 CSS 式樣',
      en: 'Disable Custom CSS',
    },
    disableUserCssText: {
      cn: '已禁用自定义 CSS 样式。如果您配置的自定义 CSS 样式导致界面出现任何问题，您可以在设置中选择启用后，删除导致问题的规则。',
    },
  });

  if (env.config.externalMenuSupported) {
    userCss.css = rule.Rule({
      id: 'custom_css',
      version: 1,
      parent: userCss.userCss,
      template: () => i18n.userCss,
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
        document.body.appendChild(style);
        // 我们添加一个可以禁用这个功能的方式以防有用户把设置对话框给隐藏了或者弄乱了改不回去
        externalMenu.add({
          title: i18n.disableUserCss,
          callback: () => {
            this.setConfig(false);
            ui.alert({
              id: 'yawf-disable-user-css',
              icon: 'succ',
              title: i18n.disableUserCss,
              text: i18n.disableUserCssText,
            });
          },
        });
      },
    });
  }

}());
