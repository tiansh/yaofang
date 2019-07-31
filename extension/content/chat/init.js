; (function () {

  const yawf = window.yawf;
  const config = yawf.config;

  const init = yawf.init = {};

  init.userConfig = new Promise(resolve => {
    init.setUserData = async function (userData) {
      const id = userData.id;
      await config.init(id);
      resolve(config.user);
    };
  });

}());
