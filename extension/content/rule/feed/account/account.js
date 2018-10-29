; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const feedParser = yawf.feed;
  const request = yawf.request;

  const i18n = util.i18n;

  i18n.authorTabTitle = { cn: '作者', tw: '作者', en: 'Author' };
  const author = yawf.rules.author = {};
  author.author = rule.Tab({
    template: () => i18n.authorTabTitle,
  });

  i18n.originalTabTitle = { cn: '原作', tw: '原作', en: 'Original' };
  const original = yawf.rules.original = {};
  original.original = rule.Tab({
    template: () => i18n.originalTabTitle,
  });

  i18n.mentionTabTitle = { cn: '提到', tw: '提到', en: 'Mention' };
  const mention = yawf.rules.mention = {};
  mention.mention = rule.Tab({
    template: () => i18n.mentionTabTitle,
  });

  const contextMenuAccounts = async function (event) {
    if (window.getSelection() + '') return [];
    const target = event.target;
    if (!(target instanceof Element)) return [];
    const user = { id: null, name: null, type: 'account' };
    // 用户链接
    ; (function (userlink) {
      if (!userlink) return;
      const params = new URLSearchParams(userlink.getAttribute('usercard'));
      if (params.has('id')) user.id = params.get('id');
      if (params.has('name')) user.id = params.get('name');
      if (userlink.matches('.WB_detail > .WB_info > .W_fb[usercard]')) user.type = 'author';
      if (userlink.matches('.WB_expand > .WB_info > .W_fb[usercard]')) user.type = 'original';
      if (userlink.matches('.WB_feed_type a[href*="loc=at"][namecard*="name"]')) user.type = 'mention';
    }(target.closest('[usercard*="name="], [usercard*="id="]')));
    // 个人主页的头像
    ; (function (photo) {
      if (!photo) return;
      user.name = photo.getAttribute('alt');
    }(target.closest('.photo[alt]')));
    // 用户卡片头像
    ; (function (usercard) {
      if (!usercard) return;
      const avatar = usercard.querySelector('[imgtype="head"][uid][title]');
      if (!avatar) return;
      user.name = avatar.title;
      user.id = avatar.getAttribute('uid');
    }(target.closest('.layer_personcard')));
    if (!user.id && !user.name) return [];
    if (!user.id || !user.name) try {
      Object.assign(user, await request.userInfo(user));
    } catch (e) { return []; }
    const template = i18n.accountContextTitle;
    const title = template.replace('{1}', () => user.name);
    return [{ title, type: user.type, value: { id: user.id, name: user.name } }];
  };
  rule.contextMenu(contextMenuAccounts);

}());
