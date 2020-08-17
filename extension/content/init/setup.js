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

  util.inject.rootKey = `yawf_${strings.randKey()}`;
  util.inject(function (rootKey, key) {
    const kebabCase = function (word) {
      if (typeof word !== 'string') return word;
      return word.replace(/./g, (char, index) => {
        const lower = char.toLowerCase();
        if (char === lower || index === 0) return lower;
        else return '-' + lower;
      });
    };
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
      const vm = node.__vue__;
      const config = vm.config;
      const event = new CustomEvent(key, {
        detail: { config: JSON.stringify(config) },
      });
      node.dispatchEvent(event);
    };

    /** @type {WeakMap<Object, Node>} */
    const vmToHtmlNode = new WeakMap();
    const seenElement = new WeakSet();
    const markElement = function (node, vm) {
      if (!vm || vm.$el !== node) return;
      const tag = kebabCase((vm.$options || {})._componentTag);
      if (tag && node instanceof Element) {
        if (node.hasAttribute('yawf-component-tag')) {
          const tags = [...new Set([...node.getAttribute('yawf-component-tag').split(' '), tag]).values()].join(' ');
          node.setAttribute('yawf-component-tag', tags);
        } else {
          node.setAttribute('yawf-component-tag', tag);
        }
      }
      const key = (vm.$vnode || {}).key;
      if (key && node instanceof Element) {
        node.setAttribute('yawf-component-key', key);
      }
      if (tag) {
        if (vmToHtmlNode.has(vm)) {
          const old = vmToHtmlNode.has(vm);
          if (old !== node) {
            reportNewNode({ tag, node, replace: true });
          }
        } else {
          reportNewNode({ tag, node, replace: false });
        }
        vmToHtmlNode.set(vm, node);
      }
    };
    const eachVmForNode = function* (node) {
      for (let vm = node.__vue__; vm && vm.$el === node; vm = vm.$parent) {
        yield vm;
      }
      for (let vm = node.__vue__; ; vm = vm.$children[0]) {
        if (!Array.isArray(vm.$children)) break;
        if (vm.$children.length !== 1) break;
        const child = vm.$children[0];
        if (!child || child.$el !== node) break;
        yield child;
      }
    };
    const eachMountedNode = function (node) {
      const vm = node.__vue__;
      if (!vm) return;
      // 如果发现根元素，那么初始化脚本
      if (vm.$parent == null) {
        reportRootNode(node);
      }
      for (let vmi of eachVmForNode(node)) {
        markElement(node, vmi);
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

    const yawf = window[rootKey] = (window[rootKey] || {});
    const vueSetup = yawf.vueSetup = (yawf.vueSetup || {});

    vueSetup.kebabCase = kebabCase;
    const eachComponentVM = vueSetup.eachComponentVM = function (tag, callback, { mounted = true, watch = true } = {}) {
      const seen = new WeakSet();
      const found = function (target) {
        if (seen.has(target)) return;
        seen.add(target);
        for (let vm of eachVmForNode(target)) {
          if (kebabCase(vm.$options._componentTag) === kebabCase(tag)) callback(target, vm);
        }
      };
      if (watch) {
        document.documentElement.addEventListener('yawf-VueNodeInserted', event => {
          if (tag !== event.detail.tag) return;
          found(event.target);
        });
      }
      if (mounted) {
        [...document.querySelectorAll(`[yawf-component-tag~="${tag}"]`)].forEach(found);
      }
    };

    /*
    const childArray = function (element) {
      return element.children || (element.componentOptions || {}).children;
    };
    const buildResult = function buildResult(vnode) {
      const tag = vnode.componentOptions ? 'x-' + vnode.componentOptions.tag : vnode.tag;
      const node = document.createElement(tag);
      node.__vnode__ = vnode;
      const data = node.data || {};
      if (typeof data.class === 'string') {
        node.className = data.class;
      } else if (Array.isArray(data.class)) {
        data.class.filter(x => x).forEach(n => node.classList.add(n));
      }
      const children = childArray(vnode);
      if (children) children.forEach(vnode => {
        if (vnode.tag == null) return;
        node.appendChild(buildResult(vnode));
      });
      return node;
    };
    const before = function (newVNode, refNode) {
      const newNode = buildResult(newVNode);
      const refVNode = refNode.__vnode__;
      const parentNode = refNode.parentNode;
      const parentVNode = parentNode.__vnode__;
      const children = childArray(parentVNode);
      const index = children.indexOf(refVNode);
      children.splice(index, 0, newVNode);
      parentNode.insertBefore(newNode, refNode);
      return newNode;
    };
    const append = function (newVNode, parentNode) {
      const parentVNode = parentNode.__vnode__;
      const children = childArray(parentVNode);
      const newNode = buildResult(newVNode);
      children.push(newVNode);
      parentNode.appendChild(newNode);
      return newNode;
    };
    const remove = function (targetNode) {
      const targetVNode = targetNode.__vnode__;
      const parentNode = targetNode.parentNode;
      const parentVNode = parentNode.__vnode__;
      const children = childArray(parentVNode);
      const index = children.indexOf(targetVNode);
      children.splice(index, 1);
      parentNode.removeChild(targetNode);
      return targetNode;
    };

    const transformRender = function (render, transformer) {
      return function (createElement) {
        const vdom = render.call(this, createElement);
        const nodeStruct = buildResult(vdom);
        transformer(nodeStruct, { before, remove, append, createElement });
        return vdom;
      };
    };
    const transformElementRender = vueSetup.transformElementRender = function (vm, transformer) {
      vm.$options.render = transformRender(vm.$options.render, transformer);
    };
    vueSetup.transformCompontentRender = function (tag, transformer) {
      eachComponentVM(tag, function (target, vm) {
        transformElementRender(vm, transformer);
        vm.$forceUpdate();
      });
    };
    */

  }, util.inject.rootKey, key);
}());

