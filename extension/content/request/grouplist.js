; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const request = yawf.request = yawf.request ?? {};

  const i18n = util.i18n;
  const functools = util.functools;

  i18n.whisperGroupName = {
    cn: '悄悄关注',
  };

  const groupList = functools.once(async function () {
    const url = new URL('/ajax/feed/allGroups?is_new_segment=1&fetch_hot=1', location.href).href;
    util.debug('fetch url %s', url);
    const resp = await fetch(url).then(resp => resp.json());
    return resp.groups[1].group; // [1] 是自定义分组，他们代码就这样
  });
  request.groupList = groupList;

}());
