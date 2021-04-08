; (function () {

  const yawf = window.yawf = window.yawf ?? {};
  const util = yawf.util = yawf.util ?? {};

  util.priority = {
    FIRST: 1000,
    HIGH: 500,
    BEFORE: 100,
    DEFAULT: 0,
    AFTER: -100,
    LOW: -500,
    LAST: -1000,
  };


}());
