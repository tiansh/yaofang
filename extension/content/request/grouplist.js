; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const network = yawf.network;
  const request = yawf.request = yawf.request || {};

  const i18n = util.i18n;
  const functools = util.functools;

  i18n.whisperGroupName = {
    cn: '悄悄关注',
  };

  const groupList = functools.once(async function () {
    const url = 'https://weibo.com/aj/f/group/list';
    util.debug('fetch url %s', url);
    const resp = await network.fetchJson(url);
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
