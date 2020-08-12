/**
 * 这个文件用于从网页中获取 $CONFIG 参数
 * 网页中的 $CONFIG 参数包含脚本需要的上下文参数，如
 * 当前用户 id、昵称，当前页面用户 id，当前主题等等
 * 我们需要当前用户 id 才能读取用户的设置从而继续后面的工作
 */

; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const strings = util.strings;

  const randStr = strings.randKey();
  const key = `yawf_${randStr}`;
  util.inject(function (key) {
    let lastReport = null;
    const reportResult = async value => {
      lastReport = lastReport ? lastReport.then(Promise.resolve()) : Promise.resolve();
      await lastReport;
      const event = new CustomEvent(key, {
        detail: { $CONFIG: JSON.stringify(value) },
      });
      window.dispatchEvent(event);
    };
    let holder = null;
    if ('$CONFIG' in window) {
      // Failed to load YAWF before $CONFIG object ready. Some feature may not work.
      const onDomContentLoaded = function () {
        window.$CONFIG = new Proxy(window.$CONFIG, {
          set: function (self, property, value) {
            self[property] = value;
            reportResult(window.$CONFIG);
            return true;
          },
        });
        reportResult(window.$CONFIG);
      };
      if (['complete', 'loaded', 'interactive'].includes(document.readyState)) {
        setTimeout(() => { onDomContentLoaded(); }, 0);
      } else {
        document.addEventListener('DOMContentLoaded', onDomContentLoaded);
      }
      return;
    }
    let proxied = void 0;
    Object.defineProperty(window, '$CONFIG', {
      configurable: true,
      enumerable: false,
      get() { return proxied; },
      set(value) {
        let $CONFIG;
        const property = Object.getOwnPropertyDescriptor(window, '$CONFIG');
        property.enumerable = true;
        Object.defineProperty(window, '$CONFIG', property);
        if (holder) {
          holder.$CONFIG = value;
          $CONFIG = holder.$CONFIG;
        } else {
          $CONFIG = value;
        }
        proxied = new Proxy($CONFIG, {
          set: function (self, property, value) {
            self[property] = value;
            reportResult($CONFIG);
            return true;
          },
        });
        reportResult(value);
      },
    });
    const onload = () => {
      window.removeEventListener('load', onload);
      reportResult();
    };
    window.addEventListener('load', onload);
  }, key);

  let lastConfig = void 0;
  window.addEventListener(key, function (event) {
    event.stopPropagation();
    if (!event.detail.$CONFIG) return;
    const $CONFIG = JSON.parse(event.detail.$CONFIG);
    if (event.detail.$CONFIG === lastConfig) return;
    lastConfig = event.detail.$CONFIG;
    init.configChange($CONFIG);
  }, true);

}());

; (function () {
  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const strings = util.strings;
  const randStr = strings.randKey();
  const key = `yawf_${randStr}`;

  document.documentElement.addEventListener(key, function (event) {
    const config = JSON.parse(event.detail.config);
    init.configChange(config);
  }, true);

  util.inject(function (key) {
    const reportNewNode = function ({ tag, node, replace, root = false }) {
      const event = new CustomEvent('yawf-VueNodeInserted', {
        bubbles: true,
        detail: { tag, replace, root },
      });
      node.dispatchEvent(event);
    };
    const reportRootNode = function (node) {
      const config = node.__vue__.config;
      const event = new CustomEvent(key, {
        detail: { config: JSON.stringify(config) },
      });
      node.dispatchEvent(event);
    };

    /** @type {WeakMap<Object, Node>} */
    const vmToHtmlNode = new WeakMap();
    /** @type {MutationCallback} */
    const markElements = function (records) {
      Array.from(records).forEach(record => {
        Array.from(record.addedNodes).forEach(node => {
          const nodes = [node];
          if (node instanceof Element) {
            nodes.push(...node.getElementsByTagName('*'));
          }
          nodes.forEach(node => {
            if (!node.__vue__) return;
            if (node.__vue__.$parent == null) {
              reportRootNode(node);
            }
            const tag = (node.__vue__.$options || {})._componentTag;
            if (tag && node instanceof Element) {
              node.setAttribute('yawf-component-tag', tag);
            }
            if (tag) {
              if (vmToHtmlNode.has(node.__vue__)) {
                const old = vmToHtmlNode.has(node.__vue__);
                if (old !== node) {
                  reportNewNode({ tag, node, replace: true });
                }
              } else {
                reportNewNode({ tag, node, replace: false });
              }
              vmToHtmlNode.set(node.__vue__, node);
            }
          });
        });
      });
    };
    const observer = new MutationObserver(markElements);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }, key);
}());

