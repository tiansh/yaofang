; (function () {

  const yawf = window.yawf = window.yawf ?? {};
  const util = yawf.util = yawf.util ?? {};

  const strings = util.strings;

  let idIndex = 0;
  const id = type => `${type}_${++idIndex}_${strings.randKey()}`;

  const baseKey = '_yawf_' + strings.randKey();
  const replyKey = baseKey + '_ack';

  class Callback {
    constructor() {
      this.id = id('callback');
    }
    invoke(...params) {
      const resp = new CustomEvent(replyKey, {
        detail: JSON.stringify({ type: 'callback', callback: this.id, params }),
      });
      window.dispatchEvent(resp);
    }
  };

  /** @type {Map<string, (event: CustomEvent) => any>} */
  const callbacks = new Map();
  let firstCall = true;

  const init = function ([baseKey, replyKey]) {
    let invokeIndex = 0;
    /** @type {Map<number, (value: any) => any>} */
    const resolver = new Map();
    /** @type {Map<string, Set<() => any>>} */
    const callbacks = new Map();
    const invoke = function ({ method: key }) {
      return async function (...params) {
        const id = ++invokeIndex;
        const result = new Promise(resolve => {
          resolver.set(id, resolve);
        });
        const event = new CustomEvent(baseKey, {
          detail: JSON.stringify({ id, method: key, params }),
        });
        window.dispatchEvent(event);
        return result;
      };
    };
    const callback = function ({ callback: key }) {
      const collection = new Set();
      callbacks.set(key, collection);
      return {
        addCallback: function (func) { collection.add(func); },
        removeCallback: function (func) { collection.delete(func); },
      };
    };
    window.addEventListener(replyKey, function (event) {
      const detail = JSON.parse(event.detail);
      if (detail.type === 'response') {
        resolver.get(detail.id)(detail.error ? Promise.reject(detail.error) : detail.result);
        resolver.delete(detail.id);
      } else if (detail.type === 'callback') {
        Array.from(callbacks.get(detail.callback) ?? []).forEach(func => {
          try { func(...detail.params); } catch (e) { /* */ }
        });
      }
    });
    const run = function (func, params) {
      const parsed = JSON.parse(params, function (key, val) {
        if (typeof val === 'object' && val._type === 'method' && val.invoke === baseKey) {
          return invoke(val);
        } else if (typeof val === 'object' && val._type === 'callback' && val.invoke === baseKey) {
          return callback(val);
        } else {
          return val;
        }
      });
      return func(...parsed);
    };
    Object.defineProperty(window, baseKey, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: run,
    });
  };

  window.addEventListener(baseKey, function (event) {
    const detail = JSON.parse(event.detail);
    const { id, method, params } = detail;
    let result = null, error = null;
    try {
      result = callbacks.get(method)(...params);
    } catch (e) {
      error = e;
    }
    const resp = new CustomEvent(baseKey + '_ack', {
      detail: JSON.stringify({ type: 'response', id, error, result }),
    });
    window.dispatchEvent(resp);
  });

  const serialize = function (param) {
    return JSON.stringify(JSON.stringify(param, function (key, val) {
      if (typeof val === 'function') {
        const key = id('method');
        callbacks.set(key, val);
        return { _type: 'method', method: key, invoke: baseKey };
      } else if (typeof val === 'object' && val instanceof Callback) {
        const key = val.id;
        return { _type: 'callback', callback: key, invoke: baseKey };
      }
      return val;
    }));
  };

  util.inject = function (func, ...params) {
    if (typeof func !== 'function') return Promise.reject();
    const setupScript = firstCall ? `(${init}(${JSON.stringify([baseKey, replyKey])}));` : ''; firstCall = false;
    const executeScript = setupScript + `window[${JSON.stringify(baseKey)}](${func},${serialize(params)});`;
    const script = document.createElement('script');
    script.textContent = executeScript;
    const target = document.head || document.body || document.documentElement;
    return new Promise(resolve => {
      script.addEventListener('load', () => {
        resolve();
        script.parentElement.removeChild(script);
      });
      if (target) target.appendChild(script);
      else setTimeout(function injectScript() {
        const target = document.head || document.body || document.documentElement;
        if (!target) setTimeout(injectScript, 10);
        else target.appendChild(script);
      }, 10);
    });
  };
  util.inject.Callback = Callback;

}());
