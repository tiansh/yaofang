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

  const groupListV6 = functools.once(async function () {
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
  request.groupList = groupListV6;

  const groupListV7 = functools.once(async function () {
    const url = new URL('/ajax/feed/allGroups?is_new_segment=1&fetch_hot=1', location.href).href;
    util.debug('fetch url %s', url);
    const resp = await fetch(url).then(resp => resp.json());
    return resp.groups[1].group; // [1] 是自定义分组，他们代码就这样
  });
  request.groupListV7 = groupListV7;

}());
