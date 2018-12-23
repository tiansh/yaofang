; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const i18n = util.i18n;

  let groupCache = null;

  i18n.whisperGroupName = {
    cn: '悄悄关注',
  };

  const groupList = async function () {
    if (groupCache) return groupCache;
    groupCache = (async function () {
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
    }());
    return groupCache;
  };
  request.groupList = groupList;

}());
