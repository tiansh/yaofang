/**
 */
; (function () {
  const yawf = window.yawf;
  const util = yawf.util;
  const init = yawf.init;

  const strings = util.strings;
  const key = `yawf_${strings.randKey()}`;

  util.inject.rootKey = `yawf_${strings.randKey()}`;

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

    /** @type {Map<string, Set<() => void>>} */
    const watchComponentVMCallbacks = new Map();
    /** @type {Set<WeakSet<VM>>} */
    const allComponentVM = new WeakSet();
    /** @type {Map<string, Set<WeakRef<VM>>>} */
    const allComponentVMByTagName = new Map();
    const finalizeVm = new FinalizationRegistry((byTagName, ref) => {
      byTagName.delete(ref);
    });
    // 发现任何 Vue 元素的时候上报消息以方便其他模块修改该元素
    const reportNewVM = function (vm, node, replace) {
      const tag = getTag(vm);
      if (allComponentVM.has(vm)) return;
      allComponentVM.add(vm);

      const ref = new WeakRef(vm);
      if (!allComponentVMByTagName.has(tag)) {
        allComponentVMByTagName.set(tag, new Set());
      }
      const byTagName = allComponentVMByTagName.get(tag);
      byTagName.add(ref);
      finalizeVm.register(vm, byTagName, ref);

      if (watchComponentVMCallbacks.has(tag)) {
        [...watchComponentVMCallbacks.get(tag)].forEach(callback => {
          callback(vm);
        });
      }
    };
    const watchComponentVM = function (tag, callback) {
      if (!watchComponentVMCallbacks.has(tag)) {
        watchComponentVMCallbacks.set(tag, new Set());
      }
      const callbacks = watchComponentVMCallbacks.get(tag);
      callbacks.add(callback);
      return function unwatch() {
        callbacks.delete(callback);
        callback = null;
      };
    };
    const getComponentsByTagName = function (tag) {
      if (!allComponentVMByTagName.has(tag)) return [];
      return [...allComponentVMByTagName.get(tag)].flatMap(ref => {
        const vm = ref.deref();
        if (!vm || !vm._isMounted) return [];
        return [vm];
      });
    };
    const eachComponentVM = function (tag, callback, { mounted = true, watch = true } = {}) {
      let error = false;
      const cb = function (vm) {
        try {
          callback(vm);
        } catch (e) {
          if (!error) {
            console.error('Error while running eachCompontentVM callback %o:\n%o', callback, e);
          }
          error = true;
        }
      };
      if (mounted) {
        getComponentsByTagName(tag).forEach(cb);
      }
      if (watch) {
        watchComponentVM(tag, cb);
      }
    };

    const routeReportObject = function (vm) {
      return vm.$route ? JSON.parse(JSON.stringify({
        name: vm.$route.name,
        fullPath: vm.$route.fullPath,
        path: vm.$route.path,
        params: vm.$route.params,
        query: vm.$route.query,
        meta: vm.$route.meta,
      })) : null;
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
    const markElement = function (node, vm) {
      if (!vm || vm.$el !== node || !vm._isMounted) return;
      const tag = getTag(vm);
      if (tag && node instanceof Element) {
        if (node.hasAttribute('yawf-component-tag')) {
          const tags = [...new Set([...node.getAttribute('yawf-component-tag').split(' '), tag]).values()].join(' ');
          node.setAttribute('yawf-component-tag', tags);
        } else {
          node.setAttribute('yawf-component-tag', tag);
        }
      }
      const key = vm.$vnode?.key;
      if (key != null && node instanceof Element) {
        node.setAttribute('yawf-component-key', key);
      }
      if (tag) {
        reportNewVM(vm, node);
      }
    };
    const eachVmForNode = function* (node) {
      const visited = new Set();
      const queue = [node.__vue__];
      while (queue.length) {
        const vm = queue.shift();
        if (vm == null || !vm._isVue) continue;
        if (vm.$el !== node || visited.has(vm)) continue;
        visited.add(vm);
        yield vm;
        if (vm.$parent) queue.unshift(vm.$parent);
        if (Array.isArray(vm.$children)) {
          queue.push(...vm.$children);
        }
        if (vm.$slots) {
          const slots = Object.keys(vm.$slots).flatMap(key => vm.$slots[key]);
          queue.push(...slots.map(slot => slot?.componentInstance));
        }
      }
    };
    const watchVueAttr = function (node) {
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
    let seenElement = new WeakSet();
    /** @param {Node} node */
    const eachMountedNode = function (node) {
      if (seenElement.has(node)) return;
      seenElement.add(node);
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.__vue__) {
          for (let vm of eachVmForNode(node)) {
            // 如果发现根元素，那么初始化脚本
            if (vm.$parent == null) {
              reportRootNode(node);
              listenRouteChange(node);
            }
            markElement(node, vm);
          }
        }
        watchVueAttr(node);
      }
      if (node.children) {
        [...node.children].forEach(eachMountedNode);
      }
    };
    /** @type {MutationCallback} */
    const observeNewNodes = function (records) {
      Array.from(records).forEach(record => {
        Array.from(record.addedNodes).forEach(eachMountedNode);
      });
    };
    const observer = new MutationObserver(observeNewNodes);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    eachMountedNode(document.documentElement);

    Object.defineProperty(window, rootKey, { value: {}, enumerable: false, writable: false });
    const yawf = window[rootKey];
    const vueSetup = yawf.vueSetup = yawf.vueSetup ?? {};

    vueSetup.getRootVm = () => rootVm;

    vueSetup.kebabCase = kebabCase;

    vueSetup.getComponentsByTagName = getComponentsByTagName;

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
      const tag = opt.Ctor?.options?.name ?? opt.tag;
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
      const data = vnode.data ?? {};
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
          appendChild(newNode, refVNode, refNode);
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
      vnode.data = vnode.data ?? {};
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
    const addEventListener = function (node, name, callback, configs = {}, nativeOn = false) {
      const vnode = vNode(node);
      const onStr = nativeOn ? 'nativeOn' : 'on';
      if (!vnode.data) vnode.data = {};
      if (!vnode.data[onStr]) vnode.data[onStr] = {};
      const on = vnode.data[onStr];
      const vueName = (configs.passive ? '&' : '') + (configs.once ? '~' : '') + (configs.capture ? '!' : '') + name;
      if (!on[vueName]) on[vueName] = callback;
      else if (!Array.isArray(on[vueName])) on[vueName] = [on[vueName], callback];
      else on[vueName].push(callback);
    };
    const removeEventListener = function (node, name, callback = null, configs = {}, nativeOn = false) {
      const vnode = vNode(node);
      const onStr = nativeOn ? 'nativeOn' : 'on';
      if (!vnode.data) return;
      if (!vnode.data[onStr]) return;
      const on = vnode.data[onStr];
      const vueName = (configs.passive ? '&' : '') + (configs.once ? '~' : '') + (configs.capture ? '!' : '') + name;
      if (!on[vueName]) return;
      if (callback == null) {
        delete on[vueName];
      } else {
        if (!Array.isArray(on[vueName])) {
          if (on[vueName] === callback) delete on[vueName];
        } else {
          on[vueName] = on[vueName].filter(c => c !== callback);
        }
      }
    };
    const getEventListener = function (node, name, configs = {}, nativeOn = false) {
      const vnode = vNode(node);
      const onStr = nativeOn ? 'nativeOn' : 'on';
      if (!vnode.data) return null;
      if (!vnode.data[onStr]) return null;
      const on = vnode.data[onStr];
      const vueName = (configs.passive ? '&' : '') + (configs.once ? '~' : '') + (configs.capture ? '!' : '') + name;
      if (!on[vueName]) return null;
      return on[vueName];
    };
    const hasAttribute = function (node, name) {
      const vnode = vNode(node);
      if (!vnode.data) return false;
      if (!vnode.data.attrs) return false;
      const value = vnode.data.attrs[name];
      if (value === false || value == null) return false;
      return true;
    };
    const getAttribute = function (node, name) {
      const vnode = vNode(node);
      if (!vnode.data) return null;
      if (!vnode.data.attrs) return null;
      return vnode.data.attrs[name];
    };
    const setAttribute = function (node, name, value) {
      const vnode = vNode(node);
      if (!vnode.data) return;
      if (!vnode.data.attrs) return;
      vnode.data.attrs[name] = value;
    };
    const removeAttribute = function (node, name) {
      const vnode = vNode(node);
      if (!vnode.data) return;
      if (!vnode.data.attrs) return;
      delete vnode.data.attrs[name];
    };
    const getTextNodeValue = function (text) {
      const vnode = vNode(text);
      return vnode.text;
    };
    const setTextNodeValue = function (text, nodeValue) {
      const vnode = vNode(text);
      if (typeof vnode.text !== 'string') return;
      vnode.text = nodeValue;
    };
    const transformSlot = function (node, slotName, transformer) {
      const vnode = vNode(node);
      const slots = vnode.data?.scopedSlots;
      if (!slots?.[slotName]) return;
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
          getEventListener,
          addEventListener,
          removeEventListener,
          setAttribute,
          hasAttribute,
          getAttribute,
          removeAttribute,
          getTextNodeValue,
          setTextNodeValue,
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

    const transformRender = function (originalRender, transformer, { raw = false } = {}) {
      if (raw) {
        return function (createElement) {
          return transformer(originalRender).call(this, createElement, { builder: builder(createElement) });
        };
      }
      let errorFlag = false;
      const wrapped = function render(createElement) {
        const { nodeStruct, Nodes, getRoot } = builder(createElement)(originalRender.call(this, createElement));
        try {
          transformer.call(this, nodeStruct, Nodes);
        } catch (e) {
          if (!errorFlag) {
            console.error('YAWF Error while inject render [%o]: %o (Following errors are supressed)', transformer, e);
            errorFlag = true;
          }
        }
        return getRoot();
      };
      wrapped.originalRender = originalRender;
      return wrapped;
    };
    const transformComponentRender = function (vm, transformer, configs = {}) {
      vm.$options.render = transformRender(vm.$options.render, transformer, configs);
    };
    const transformComponentsRenderByTagName = function (tag, transformer, configs = {}) {
      eachComponentVM(tag, function (vm) {
        transformComponentRender(vm, transformer, configs);
        vm.$forceUpdate();
      });
    };
    vueSetup.eachComponentVM = eachComponentVM;
    vueSetup.transformComponentRender = transformComponentRender;
    vueSetup.transformComponentsRenderByTagName = transformComponentsRenderByTagName;

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

