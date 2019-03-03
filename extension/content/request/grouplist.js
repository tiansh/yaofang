; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const i18n = util.i18n;
  const functools = util.functools;

  let groupCache = null;

  i18n.whisperGroupName = {
    cn: '悄悄关注',
  };

  const groupList = functools.once(async function () {
    const resp = await fetch('https://weibo.com/aj/f/group/list', { credentials: 'include' }).then(r => r.json());
    const groups = resp.data.map(function (group) {
      return {
        id: 'g' + group.gid,
        name: group.gname,
        type: 'group',
      };
    });
    const special = [{
      id: 'whisper',
      name: i18n.whisperGroupName,
      type: 'whisper',
    }];
    return [...special, ...groups];
  });
  request.groupList = groupList;

}());
