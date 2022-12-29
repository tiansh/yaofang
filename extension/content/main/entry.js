// 这个文件用于向界面上添加菜单项
; (function () {
  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;
  const rule = yawf.rule;

  const showRuleDialog = function (tab = null) {
    try {
      rule.dialog(tab);
    } catch (e) { util.debug('Error while prompting dialog: %o', e); }
  };

  init.onLoad(() => {
    util.inject(function (rootKey, showRuleDialog) {
      const yawf = window[rootKey];
      const vueSetup = yawf.vueSetup;

      vueSetup.eachComponentVM('weibo-top-nav', function (vm) {
        vm.configs.splice(-1, 0, {
          divider: true,
          href: '',
          name: '药方设置',
          type: 'yawf-config',
        });
        vm.configHandle = (function (configHandle) {
          return function (index) {
            if (this.configs[index].type === 'yawf-config') {
              this.configClose = true;
              showRuleDialog();
            } else {
              configHandle.call(this, index);
            }
          }.bind(vm);
        }(vm.configHandle));
      });
    }, util.inject.rootKey, showRuleDialog);
  });

}());
