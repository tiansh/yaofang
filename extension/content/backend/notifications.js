; (function () {

  const yawf = window.yawf = window.yawf || {};
  const notifications = yawf.notifications = {};
  const message = yawf.message;

  notifications.show = async function ({ title, content, icon = null, duration = Infinity }) {
    return await message.invoke.showNotifications({ title, content, icon, duration });
  };

}());
