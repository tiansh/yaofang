; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const stk = yawf.stk = {};
  const strings = util.strings;

  const randStr = strings.randKey();
  const key = `yawf_stk_${randStr}`;

  util.inject(function (key) {
    if (window.STK) return;

    const wrappers = [];

    const wrapRegister = function (register) {
      return function (name, registerFunction, scope) {
        const original = registerFunction;
        let wrapped = original;
        if (name === 'namespace') {
          wrapped = wrapNamespace(registerFunction);
        } else {
          wrappers.forEach(wrapper => {
            if (name === wrapper.name) {
              wrapped = wrapper.wrapper(registerFunction);
            }
          });
        }
        return register.call(this, name, wrapped, scope);
      };
    };

    const wrapNamespace = function (namespaceFunctionGetter) {
      return function () {
        const namespaceFunction = namespaceFunctionGetter.apply(this, arguments);
        const fakeNamespaceKey = 'yawf_proto_getter';
        const namespaceInstance = namespaceFunction(fakeNamespaceKey);
        const namespacePrototype = namespaceInstance.constructor.prototype;
        namespacePrototype.register = wrapRegister(namespacePrototype.register);
        delete namespacePrototype.namespace[fakeNamespaceKey];
        return namespaceFunction;
      };
    };

    let stk = null;
    Object.defineProperty(window, 'STK', {
      get() { return stk; },
      set(trueStk) {
        trueStk.register = wrapRegister(trueStk.register);
        stk = trueStk;
      },
      enumerable: true,
    });

    Object.defineProperty(window, key, {
      get() { return void 0; },
      set({ name, wrapper }) {
        wrappers.push({ name, wrapper });
      },
      enumerable: false,
    });

  }, key);

  stk.wrap = async function (name, wrapper, ...params) {
    util.inject(`function (key, name, params) { window[key] = { name, wrapper: (${wrapper}(...params)) }; }`, key, name, params);
  };

  let stkInfoResolve = null;
  stk.info = new Promise(resolve => { stkInfoResolve = resolve; });
  const initInfoKey = 'yawf_init_info' + strings.randKey();
  yawf.stk.wrap('pl.top.source.init', function (initInfoKey) {
    const gotInfo = function (info) {
      const event = new CustomEvent(initInfoKey, {
        detail: { info: JSON.stringify(info) },
      });
      window.dispatchEvent(event);
    };
    return function (regFunc) {
      return function (stk) {
        const inner = regFunc.call(this, stk);
        return function (plc_top, info, ...params) {
          gotInfo(info);
          return inner(plc_top, info, ...params);
        };
      };
    };
  }, initInfoKey);

  window.addEventListener(initInfoKey, function gotInitInfo(event) {
    event.stopPropagation();
    if (!event.detail.info) return;
    const info = JSON.parse(event.detail.info);
    stkInfoResolve(Object.freeze(info));
    window.removeEventListener(initInfoKey, gotInitInfo);
  }, true);

}());
