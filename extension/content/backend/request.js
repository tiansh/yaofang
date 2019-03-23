/**
 * 这个文件用于阻塞各类网络请求
 * 这些网络请求的具体处理方式交由内容页脚本决定，由 content/request.js 负责
 */
; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const init = yawf.init;
  const message = yawf.message;
  const backend = yawf.backend = yawf.backend || {};

  /** @type {Map<string, Function>} */
  const requestHandler = new Map();
  /** @type {Map<string, Array<{ details: any, resolve: Function }>>} */
  const pendingRequest = new Map();
  let pageDeinited = false;

  message.export(function request(id, details) {
    if (requestHandler.has(id)) {
      return requestHandler.get(id)(details);
    }
    if (pageDeinited) return {};
    return new Promise(resolve => {
      if (!pendingRequest.has(id)) pendingRequest.set(id, []);
      pendingRequest.get(id).push({ details, resolve });
    });
  });

  backend.onRequest = function (id, handler) {
    requestHandler.set(id, handler);
    if (pendingRequest.has(id)) Promise.resolve().then(() => {
      pendingRequest.get(id).forEach(({ details, resolve }) => {
        try {
          resolve(Promise.resolve(handler(details)));
        } catch (e) {
          resolve(Promise.reject(e));
        }
      });
      pendingRequest.delete(id);
    });
  };

  init.onDeinit(() => {
    [...pendingRequest.values()].forEach(requests => {
      requests.forEach(({ resolve }) => {
        resolve({});
      });
    });
    pendingRequest.clear();
    pageDeinited = true;
  });

}());
