; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const layout = yawf.rules.layout;

  const i18n = util.i18n;
  const css = util.css;

  const scroll = layout.scroll = {};

  i18n.scrollToolGroupTitle = {
    cn: '随页面滚动元素',
    tw: '隨頁面捲動元素',
    en: 'Elements Scroll with Page',
  };

  scroll.scroll = rule.Group({
    parent: layout.layout,
    template: () => i18n.scrollToolGroupTitle,
  });

  const scrollAfterMerge = (prefer = 'left') => () => {
    if (!scroll.scrollLeft.getConfig()) return;
    if (!scroll.scrollRight.getConfig()) return;
    if (!layout.sidebar.merge.getConfig()) return;
    if (prefer === 'left') {
      scroll.scrollRight.setConfig(false);
    } else {
      scroll.scrollLeft.setConfig(false);
    }
  };

  Object.assign(i18n, {
    scrollLeft: { cn: '允许首页左边栏随页面滚动始终显示', tw: '允許首頁左邊欄隨頁面捲動始終顯示', en: 'Floating left column' },
    scrollRight: { cn: '允许首页右边栏随页面滚动始终显示', tw: '允許首頁右邊欄隨頁面捲動始終顯示', en: 'Floating right column' },
    scrollOthers: { cn: '允许其他元素随页面滚动始终显示', tw: '允許其他元素隨頁面捲動始終顯示', en: 'Floating other elements' },
  });

  scroll.scrollLeft = rule.Rule({
    id: 'layout_left_move',
    version: 1,
    parent: scroll.scroll,
    initial: true,
    template: () => i18n.scrollLeft,
    // 如果合并了左右边栏，那么左栏浮动的时候右栏不能浮动
    init() {
      this.addConfigListener(scrollAfterMerge('left'));
    },
    ainit() {
      // 禁用左栏浮动的相关代码在禁用右边栏浮动的逻辑那里统一处理
      // 如果合并了边栏，那么会因为禁用右栏浮动而同时禁用在右栏里面的左栏
      // 这时候左栏如果还要浮动，那么就要重新让他动起来
      // 这里的程序是为了让左栏再动起来的
      if (!layout.sidebar.merge.getConfig()) return;
      css.append(`
.WB_main_r .WB_main_l { will-change: scroll-position; }
.WB_main_r[yawf-fixed] .WB_main_l { position: fixed; top: 60px !important; overflow: hidden; height: auto !important; width: 150px; }
body[yawf-merge-left] .WB_main_r[yawf-fixed] .WB_main_l { width: 229px; }
`);
      if (layout.navbar.autoHide.getConfig()) {
        util.css.append('.WB_main_r[yawf-fixed] .WB_main_l { top: 10px !important; }');
      }

      // 限制左栏最大高度，避免超出中间区域
      const updateMaxHeight = function (left, maxHeight) {
        const none = maxHeight == null;
        const text = none ? 'none' : maxHeight + 'px';
        const srl = left.querySelector('[node-type="leftnav_scroll"]');
        if (!srl) return;
        if ((left.style.maxHeight || 'none') !== text) {
          left.style.maxHeight = text;
          if (none) srl.setAttribute('style', '');
          else {
            const lev = Array.from(srl.querySelectorAll('.lev_Box'));
            const ch = lev.map(lb => lb.clientHeight).reduce((x, y) => x + y);
            const height = Math.min(maxHeight - srl.offsetTop, ch) + 'px';
            if (srl.style.height !== height) {
              srl.style.height = height;
              srl.style.position = 'relative';
            }
          }
        }
      };

      // 每当滚动滚动条或调整窗口大小时，更新左栏状态
      let hasScroll = false;
      const updateLeftPosition = function updateLeftPosition() {
        const left = document.querySelector('.yawf-WB_left_nav');
        const reference = document.querySelector('.WB_main_r');
        const container = document.querySelector('#plc_main');
        if (!left || !reference) return;
        const refc = reference.getClientRects();
        if (!refc?.[0]) return;
        const pos = refc[0];
        if (!hasScroll) {
          if (pos.bottom < -60) {
            hasScroll = true;
            reference.setAttribute('yawf-fixed', '');
          }
        } else {
          if (pos.bottom + left.clientHeight > 60) {
            hasScroll = false;
            reference.removeAttribute('yawf-fixed');
          }
        }
        if (hasScroll) {
          const cip = container.getClientRects()[0];
          const fip = left.getClientRects()[0];
          const no_space = false; // filter.items.style.sweibo.no_weibo_space.conf;
          const maxHeightBottom = cip.bottom - fip.top + (no_space ? 0 : -10);
          const maxHeight = Math.max(Math.min(maxHeightBottom, window.innerHeight - 80), 0);
          if (cip && fip) updateMaxHeight(left, maxHeight);
        } else { updateMaxHeight(left); }
      };

      document.addEventListener('scroll', updateLeftPosition);
      window.addEventListener('resize', updateLeftPosition);
      observer.dom.add(updateLeftPosition);
    },
  });

  scroll.scrollRight = rule.Rule({
    id: 'layout_right_move',
    version: 1,
    parent: scroll.scroll,
    initial: true,
    template: () => i18n.scrollRight,
    init() {
      this.addConfigListener(scrollAfterMerge('right'));

      const merge = layout.sidebar.merge.getConfig();
      const fleft = scroll.scrollLeft.getConfig();
      const fright = scroll.scrollRight.getConfig();
      const fother = scroll.scrollOthers.getConfig();
      const itemAttrs = ['fixed-item', 'fixed-box'];
      const containerAttrs = ['fixed-inbox', 'fixed-id'];
      const withIn = [];
      const queryString = function (classNames, attributes) {
        return classNames.map(className => (
          attributes.map(attribute => `${className} [${attribute}]`).join(',')
        )).join(',');
      };
      if (!fright) withIn.push('.WB_main_r');
      if (!fleft || merge) withIn.push('.WB_main_l');
      if (!fother) { withIn.push('.WB_frame_b', '.WB_frame_c'); }
      if (withIn.length === 0) return;

      const removeFixed = function removeFixed() {
        const itemQuery = queryString(withIn, itemAttrs);
        const items = Array.from(document.querySelectorAll(itemQuery));
        items.forEach(function (fixed) {
          const cloned = fixed.cloneNode(true);
          itemAttrs.forEach(attr => { cloned.removeAttribute(attr); });
          fixed.replaceWith(cloned);
        });
        const containerQuery = queryString(withIn, containerAttrs);
        const containers = Array.from(document.querySelectorAll(containerQuery));
        containers.forEach(function (container) {
          const cloned = container.cloneNode(true);
          containerAttrs.forEach(function (attr) { cloned.removeAttribute(attr); });
          const parent = container.parentNode;
          const prev = parent.previousElementSibling;
          const hadWraped = parent.style.willChange && prev && prev.innerHTML === '';
          const replaceTarget = hadWraped ? parent : container;
          if (hadWraped) prev.remove();
          replaceTarget.replaceWith(cloned);
        });
      };
      observer.dom.add(removeFixed);
    },
  });

  scroll.scrollOthers = rule.Rule({
    id: 'layout_other_move',
    version: 1,
    parent: scroll.scroll,
    template: () => i18n.scrollOthers,
    initial: true,
  });

}());
