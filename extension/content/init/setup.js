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
    if (event.detail.route) {
      const route = JSON.parse(event.detail.route);
      init.page.update(route);
    }
    if (event.detail.config) {
      const config = JSON.parse(event.detail.config);
      init.configChange(config);
    }
  }, true);

  util.inject.rootKey = `yawf_${strings.randKey()}`;
  util.inject(function (rootKey, key) {
    let rootVm = null;

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
    const routeReportObject = function (vm) {
      return {
        name: vm.$route.name,
        fullPath: vm.$route.fullPath,
        path: vm.$route.path,
        params: JSON.parse(JSON.stringify(vm.$route.params)),
        query: JSON.parse(JSON.stringify(vm.$route.query)),
        meta: JSON.parse(JSON.stringify(vm.$route.meta)),
      };
    };
    // 发现 Vue 根元素的时候启动脚本的初始化
    const reportRootNode = function (node) {
      const vm = node.__vue__;
      rootVm = vm;
      const config = vm.config;
      const route = routeReportObject(vm);
      const event = new CustomEvent(key, {
        detail: {
          config: JSON.stringify(config),
          route: JSON.stringify(route),
        },
      });
      node.dispatchEvent(event);
    };
    const reportRouteChange = function (route) {
      const event = new CustomEvent(key, {
        detail: { route: JSON.stringify(route) },
      });
      document.documentElement.dispatchEvent(event);
    };
    let unwatchRouteChange = null;
    const listenRouteChange = function (node) {
      if (unwatchRouteChange) unwatchRouteChange();
      const vm = node.__vue__;
      unwatchRouteChange = vm.$watch(function () {
        return JSON.stringify(routeReportObject(vm));
      }, function (route) {
        reportRouteChange(JSON.parse(route));
      });
    };

    const getTag = function (vm) {
      const name = kebabCase(vm.$options.name || vm.$options._componentTag);
      return name;
    };
    /** @type {WeakMap<Object, Node>} */
    const vmToHtmlNode = new WeakMap();
    const seenElement = new WeakSet();
    const markElement = function (node, vm) {
      if (!vm || vm.$el !== node) return;
      const tag = getTag(vm);
      if (tag && node instanceof Element) {
        if (node.hasAttribute('yawf-component-tag')) {
          const tags = [...new Set([...node.getAttribute('yawf-component-tag').split(' '), tag]).values()].join(' ');
          node.setAttribute('yawf-component-tag', tags);
        } else {
          node.setAttribute('yawf-component-tag', tag);
        }
      }
      const key = (vm.$vnode || {}).key;
      if (key != null && node instanceof Element) {
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
        listenRouteChange(node);
      }
      for (let vmi of eachVmForNode(node)) {
        markElement(node, vmi);
      }
      if (seenElement.has(node)) return;
      seenElement.add(node);
      let __vue__ = node.__vue__;
      delete node.__vue__;
      Object.defineProperty(node, '__vue__', {
        configurable: true,
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

    Object.defineProperty(window, rootKey, { value: {}, enumerable: false, writable: false });
    const yawf = window[rootKey];
    const vueSetup = yawf.vueSetup = (yawf.vueSetup || {});

    vueSetup.getRootVm = () => rootVm;

    vueSetup.kebabCase = kebabCase;
    const eachComponentVM = vueSetup.eachComponentVM = function (tag, callback, { mounted = true, watch = true } = {}) {
      const seen = new WeakSet();
      const found = function (target) {
        if (seen.has(target)) return;
        seen.add(target);
        for (let vm of eachVmForNode(target)) {
          if (getTag(vm) === kebabCase(tag)) callback(vm);
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
    const getComponentsByTagName = vueSetup.getComponentsByTagName = function (tag) {
      const result = [];
      eachComponentVM(tag, result.push.bind(result), { watch: false });
      return result;
    };

    vueSetup.closest = function (vm, tag) {
      for (let p = vm; p; p = p.$parent) {
        if (getTag(p) === kebabCase(tag)) {
          return p;
        }
      }
      return null;
    };

    // 下面这一串都没测试过
    const childArray = function (element, createChildren) {
      if (Array.isArray(element)) {
        return element;
      } else if (element.componentOptions) {
        if (!element.componentOptions.children && createChildren) {
          element.componentOptions.children = [];
        }
        return element.componentOptions.children;
      } else {
        if (!element.children && createChildren) {
          element.children = [];
        }
        return element.children;
      }
    };
    const parseClass = className => {
      if (className == null) {
        return '';
      } else if (typeof className === 'string') {
        return [...new Set(className.trim().split(/\s+/))].join(' ');
      } else if (Array.isArray(className)) {
        return parseClass(className.map(parseClass).join(' '));
      } else if (typeof className === 'object') {
        return parseClass(Object.keys(className).filter(key => className[key]).join(' '));
      }
      return '';
    };
    const getVNodeTag = function (vnode) {
      if (!vnode.componentOptions) return vnode.tag;
      const opt = vnode.componentOptions;
      const tag = opt.Ctor && opt.Ctor.options && opt.Ctor.options.name || opt.tag;
      return 'x-' + kebabCase(tag);
    };
    const buildNodes = function buildNodes(vnode) {
      if (Array.isArray(vnode)) {
        const fragment = document.createElement('x-yawf-fragment');
        fragment.__vnode__ = vnode;
        vnode.forEach(child => { fragment.appendChild(buildNodes(child)); });
        return fragment;
      }
      const tag = getVNodeTag(vnode);
      if (tag == null && vnode.text) {
        const node = document.createTextNode(vnode.text);
        node.__vnode__ = vnode;
        return node;
      }
      if (tag == null) {
        const node = document.createComment('');
        node.__vnode__ = vnode;
        return node;
      }
      const node = document.createElement(tag);
      node.__vnode__ = vnode;
      const data = vnode.data || {};
      const className = parseClass(data.class);
      if (className) node.className = className;
      const staticClassName = parseClass(data.staticClass);
      if (staticClassName) node.className += ' ' + staticClassName;
      const children = childArray(vnode);
      if (children) children.forEach(vnode => {
        node.appendChild(buildNodes(vnode));
      });
      return node;
    };
    const vNode = function (node) {
      return node.__vnode__;
    };
    const insertBefore = function (parentNode, newVNode, refNode, newNode) {
      if (refNode === null) {
        return appendChild(parentNode, newVNode);
      }
      if (newNode == null) newNode = buildNodes(newVNode);
      const refVNode = vNode(refNode);
      const parentVNode = vNode(parentNode);
      const children = childArray(parentVNode);
      const index = children.indexOf(refVNode);
      children.splice(index, 0, newVNode);
      parentNode.insertBefore(newNode, refNode);
      return newNode;
    };
    const appendChild = function (parentNode, newVNode, newNode) {
      const parentVNode = vNode(parentNode);
      const children = childArray(parentVNode, true);
      if (newNode == null) newNode = buildNodes(newVNode);
      children.push(newVNode);
      parentNode.appendChild(newNode);
      return newNode;
    };
    const removeChild = function (parentNode, targetNode) {
      const targetVNode = vNode(targetNode);
      const parentVNode = vNode(parentNode);
      const children = childArray(parentVNode);
      const index = children.indexOf(targetVNode);
      children.splice(index, 1);
      parentNode.removeChild(targetNode);
      return targetVNode;
    };
    const wrapNode = function (chroot) {
      return function (refNode, newVNode) {
        const newNode = buildNodes(newVNode);
        const refVNode = vNode(refNode);
        const parentNode = refNode.parentNode;
        if (!parentNode) {
          chroot(newVNode);
          appendChild(newNode, refNode);
        } else {
          insertBefore(parentNode, newVNode, refNode, newNode);
          removeChild(parentNode, refNode);
          appendChild(newNode, refVNode, refNode);
        }
        return newNode;
      };
    };
    const changeRoot = function (chroot) {
      return function (rootNode) {
        const parentNode = rootNode.parentNode;
        if (parentNode) {
          removeChild(parentNode, rootNode);
        }
        const rootVNode = vNode(rootNode);
        chroot(rootVNode);
        return rootNode;
      };
    };
    const classModify = function (node, add, remove) {
      const vnode = vNode(node);
      vnode.data = vnode.data || {};
      const added = parseClass([parseClass(vnode.data.class), ...add].join(' '));
      const removed = added.split(/\s+/).filter(c => !remove.includes(c)).join(' ');
      vnode.data.class = removed;
      node.className = removed;
    };
    const addClass = function (node, ...classNames) {
      classModify(node, classNames.filter(x => x && typeof x === 'string'), []);
    };
    const removeClass = function (node, ...classNames) {
      classModify(node, [], classNames.filter(x => x && typeof x === 'string'));
    };
    const transformSlot = function (node, slotName, transformer) {
      const vnode = vNode(node);
      const slots = (vnode.data || {}).scopedSlots;
      if (!slots || !slots[slotName]) return;
      slots[slotName] = transformRender(slots[slotName], transformer);
    };
    const builder = function (createElement) {
      return function (root) {
        const replaceRoot = newRoot => { root = newRoot; };
        const nodeStruct = buildNodes(root);
        const Nodes = {
          vNode,
          replaceRoot,
          insertBefore,
          removeChild,
          appendChild,
          wrapNode: wrapNode(replaceRoot),
          unwrapNode: changeRoot(replaceRoot),
          addClass,
          removeClass,
          createElement,
          h: createElement,
          transformSlot,
        };
        return {
          nodeStruct,
          Nodes,
          getRoot: () => root,
        };
      };
    };

    const transformRender = function (render, transformer, { raw = false } = {}) {
      if (raw) {
        return function (createElement) {
          return transformer(render).call(this, createElement, { builder: builder(createElement) });
        };
      }
      return function (createElement) {
        const { nodeStruct, Nodes, getRoot } = builder(createElement)(render.call(this, createElement));
        try {
          transformer.call(this, nodeStruct, Nodes);
        } catch (e) {
          console.error('YAWF Error while inject render [%o]: %o', transformer, e);
        }
        return getRoot();
      };
    };
    const transformComponentRender = vueSetup.transformComponentRender = function (vm, transformer, configs = {}) {
      vm.$options.render = transformRender(vm.$options.render, transformer, configs);
    };
    vueSetup.transformComponentsRenderByTagName = function (tag, transformer, configs = {}) {
      eachComponentVM(tag, function (vm) {
        transformComponentRender(vm, transformer, configs);
        vm.$forceUpdate();
      });
    };

    const isSimpleClick = function (event) {
      if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return false;
      if (event.which !== 1) return false;
      return true;
    };
    document.documentElement.addEventListener('click', function (event) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const mfsp = target.closest('a.yawf-link-mfsp');
      if (mfsp) {
        if (!isSimpleClick(event)) {
          event.stopPropagation();
        }
      }
      const nmfpd = target.closest('a.yawf-link-nmfpd');
      if (nmfpd) {
        if (isSimpleClick(event)) {
          event.preventDefault();
        }
      }
    }, { capture: true });
  }, util.inject.rootKey, key);
}());

