; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.accountTabTitle = {
    cn: '帐号',
    tw: '帳號',
    en: 'User',
  };

  const account = yawf.rules.account = {};
  account.account = rule.Tab({
    template: () => i18n.accountTabTitle,
  });

  class AccountFilterRule extends rule.class.Rule {
    constructor(item) {
      item.always = true;
      item.ref = item.ref || {};
      item.ref.account = { type: 'users' };
      item.feedAction = item.id;
      super(item);
    }
  }
  rule.class.AccountFilterRule = AccountFilterRule;

}());
