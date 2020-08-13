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

// TODO!
// NEED CLEAN UP

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
    // 发现任何 Vue 元素的时候上报消息以方便其他模块修改该元素
    const reportNewNode = function ({ tag, node, replace, root = false }) {
      const event = new CustomEvent('yawf-VueNodeInserted', {
        bubbles: true,
        detail: { tag, replace, root },
      });
      node.dispatchEvent(event);
    };
    // 发现 Vue 根元素的时候启动脚本的初始化
    const reportRootNode = function (node) {
      const config = node.__vue__.config;
      const event = new CustomEvent(key, {
        detail: { config: JSON.stringify(config) },
      });
      node.dispatchEvent(event);
    };

    /** @type {WeakMap<Object, Node>} */
    const vmToHtmlNode = new WeakMap();
    const seenElement = new WeakSet();
    const markElement = function (node, instance) {
      if (!instance || instance.$el !== node) return;
      const tag = (instance.$options || {})._componentTag;
      if (tag && node instanceof Element) {
        if (node.hasAttribute('yawf-component-tag')) {
          const tags = [...new Set([...node.getAttribute('yawf-component-tag').split(' '), tag]).values()].join(' ');
          node.setAttribute('yawf-component-tag', tags);
        } else {
          node.setAttribute('yawf-component-tag', tag);
        }
      }
      if (tag) {
        if (vmToHtmlNode.has(instance)) {
          const old = vmToHtmlNode.has(instance);
          if (old !== node) {
            reportNewNode({ tag, node, replace: true });
          }
        } else {
          reportNewNode({ tag, node, replace: false });
        }
        vmToHtmlNode.set(instance, node);
      }
    };
    const eachMountedNode = function (node) {
      if (!node.__vue__) return;
      if (node.__vue__.$parent == null) {
        reportRootNode(node);
      }
      for (let instance = node.__vue__; instance && instance.$el === node; instance = instance.$parent) {
        markElement(node, instance);
      }
      if (seenElement.has(node)) return;
      seenElement.add(node);
      let __vue__ = node.__vue__;
      delete node.__vue__;
      Object.defineProperty(node, '__vue__', {
        set(n) {
          __vue__ = n;
          markElement(node, n);
        },
        get() {
          return __vue__;
        },
      });
    };
    /** @type {MutationCallback} */
    const observeNewNodes = function (records) {
      Array.from(records).forEach(record => {
        Array.from(record.addedNodes).forEach(node => {
          const nodes = [node];
          if (node instanceof Element) {
            nodes.push(...node.getElementsByTagName('*'));
          }
          nodes.forEach(node => {
            eachMountedNode(node);
          });
        });
      });
    };
    const observer = new MutationObserver(observeNewNodes);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const yawf = window.yawf = (window.yawf || {});
    const vueSetup = yawf.vueSetup = (yawf.vueSetup || {});

    const eachComponentInstance = vueSetup.eachComponentInstance = function (tag, callback) {
      const seen = new WeakSet();
      const found = function (target) {
        if (seen.has(target)) return;
        seen.add(target);
        let instance = target.__vue__;
        for (; instance && instance.$el === target; instance = instance.$parent) {
          if ((instance.$options || {})._componentTag === tag) {
            callback(target, instance);
          }
        }
      };
      document.documentElement.addEventListener('yawf-VueNodeInserted', event => {
        if (tag !== event.detail.tag) return;
        found(event.target);
      });
      [...document.querySelectorAll(`[yawf-component-tag~="${tag}"]`)].forEach(found);
    };

    /*
    const childArray = function (element) {
      return element.children || (element.componentOptions || {}).children;
    };
    const buildResult = function buildResult(element) {
      const node = document.createElement(element.tag);
      node.__vue_element__ = element;
      const data = node.data || {};
      if (typeof data.class === 'string') {
        node.className = data.class;
      }
      if (Array.isArray(data.class)) {
        data.class.filter(x => x).forEach(n => node.classList.add(n));
      }
      const children = childArray(element);
      if (children) children.forEach(element => node.appendChild(buildResult(element)));
      return node;
    };
    const before = function (newElement, refNode) {
      const newNode = buildResult(newElement);
      const refElement = refNode.__vue_element__;
      const parentNode = refNode.parentNode;
      const parentElement = parentNode.__vue_element__;
      const children = childArray(parentElement);
      const index = children.indexOf(refElement);
      children.splice(index, 0, newElement);
      parentNode.insertBefore(newNode, refNode);
      return newNode;
    };
    const append = function (newElement, parentNode) {
      const parentElement = parentNode.__vue_element__;
      const children = childArray(parentElement);
      const newNode = buildResult(newElement);
      children.push(newElement);
      parentNode.appendChild(newNode);
      return newNode;
    };
    const remove = function (targetNode) {
      const targetElement = targetNode.__vue_element__;
      const parentNode = targetNode.parentNode;
      const parentElement = parentNode.__vue__element__;
      const children = childArray(parentElement);
      const index = children.indexOf(targetElement);
      children.splice(index, 1);
      parentNode.removeChild(targetNode);
      return targetNode;
    };

    const transformRender = vueSetup.transformRender = function (render, transformer) {
      return function (createElement) {
        const result = render.call(this, createElement);
        const nodeStruct = buildResult(result);
        transformer(nodeStruct, { before, remove, append, createElement });
        return result;
      };
    };
    const transformElementRender = vueSetup.transformElementRender = function (instance, transformer) {
      instance.$options.render = transformRender(instance.$options.render, transformer);
    };
    vueSetup.transformCompontentRender = function (tag, transformer) {
      eachComponentInstance(tag, function (target, instance) {
        transformElementRender(instance, transformer);
        instance.$forceUpdate();
      });
    };
    */
  }, key);
}());

