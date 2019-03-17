; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

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
      get() { return void 0 },
      set({ name, wrapper }) {
        wrappers.push({ name, wrapper });
      },
      enumerable: false,
    });

  }, key);

  stk.wrap = async function (name, wrapper, ...params) {
    util.inject(`function (key, name, params) { window[key] = { name, wrapper: (${wrapper}(...params)) }; }`, key, name, params);
  };

}());
