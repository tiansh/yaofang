; (function () {

  const yawf = window.yawf;
  const util = yawf.util = yawf.util ?? {};

  const keyboard = util.keyboard;
  const i18n = util.i18n;
  const css = util.css;

  const ui = util.ui = util.ui ?? {};

  i18n.okButtonTitle = {
    cn: '确定',
    tw: '確定',
    en: 'Confirm',
  };
  i18n.cancelButtonTitle = {
    cn: '取消',
    tw: '取消',
    en: 'Cancel',
  };
  i18n.closeButtonTitle = {
    cn: '关闭',
    tw: '關閉',
    en: 'Close',
  };

  const dialogStack = [];
  /**
   * 显示一个对话框
   * @param {{ id: string, title: string, render: Function, button: { [type: string]: Function? }?, bar: boolean? }}
   */
  ui.dialog = function ({ id, title, render, button }) {
    // 初始化 DOM
    const template = document.createElement('template');
    template.innerHTML = `
<div class="woo-box-flex woo-box-alignCenter woo-box-justifyCenter woo-modal-wrap woo-modal-an--pop-enter">
  <div class="woo-modal-main yawf-dialog">
    <i class="woo-font woo-font--cross yawf-dialog-close"></i>
    <div class="woo-box-flex woo-box-column woo-box-alignCenter woo-dialog-main" aria-modal="true" tabindex="0" role="alertdialog">
      <div class="woo-dialog-title yawf-dialog-title"></div>
      <div class="woo-dialog-body yawf-dialog-content">
      </div>
      <div class="woo-dialog-ctrl yawf-dialog-buttons">
        <button class="woo-button-main woo-button-line woo-button-default woo-button-m woo-button-round woo-dialog-btn yawf-dialog-button-cancel"><span class="woo-button-wrap"><span class="woo-button-content"></span></span></button>
        <button class="woo-button-main woo-button-flat woo-button-primary woo-button-m woo-button-round woo-dialog-btn yawf-dialog-button-ok"><span class="woo-button-wrap"><span class="woo-button-content"></span></span></button>
      </div>
    </div>
  </div>
  <div class="woo-modal-mask yawf-dialog-mask"></div>
</div>
`;
    const container = document.importNode(template.content.firstElementChild, true);
    const dialog = container.querySelector('.yawf-dialog') || container;
    dialog.id = id;
    const titleNode = dialog.querySelector('.yawf-dialog-title');
    const buttonCollectionNode = dialog.querySelector('.yawf-dialog-buttons');
    const okButton = dialog.querySelector('.yawf-dialog-button-ok');
    const cancelButton = dialog.querySelector('.yawf-dialog-button-cancel');
    const closeButton = dialog.querySelector('.yawf-dialog-close');
    const mask = container.querySelector('.yawf-dialog-mask');
    const contentNode = dialog.querySelector('.yawf-dialog-content');
    // 填入内容
    titleNode.textContent = title;
    titleNode.classList.add('woo-dialog-bar');
    okButton.textContent = i18n.okButtonTitle;
    cancelButton.textContent = i18n.cancelButtonTitle;
    closeButton.title = i18n.closeButtonTitle;
    render(contentNode, Object.assign({}, ...[
      { close: closeButton },
      button?.ok ? { ok: okButton } : {},
      button?.cancel ? { cancel: cancelButton } : {},
    ]));
    // 定位对话框的位置
    const lastPos = { x: 0, y: 0 };
    const setPos = function ({ x, y }) {
      const left = Math.min(Math.max(0, x), document.body.clientWidth - dialog.clientWidth - 2);
      const top = Math.min(Math.max(0, y), document.body.clientHeight - dialog.clientHeight - 2);
      if (left + 'px' !== dialog.style.left) dialog.style.left = left + 'px';
      if (top + 'px' !== dialog.style.top) dialog.style.top = top + 'px';
      return Object.assign(lastPos, { x: left, y: top });
    };
    // 网页滚动时维持在页面内
    const resetPos = () => { setPos(lastPos); };
    const dragMoveStart = (function mouseDrag() {
      const mouseStart = {};
      // 拖拽移动
      const dragMove = event => {
        setPos({
          x: event.screenX - mouseStart.x,
          y: event.screenY - mouseStart.y,
        });
      };
      // 拖拽结束
      const dragMoveDone = function () {
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragMoveDone);
        dialog.classList.remove('yawf-drag');
        if (dialog.releaseCapture) { dialog.releaseCapture(); }
      };
      // 开始拖拽
      const dragMoveStart = function (e) {
        Object.assign(mouseStart, {
          x: e.screenX - lastPos.x,
          y: e.screenY - lastPos.y,
        });
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragMoveDone);
        dialog.classList.add('yawf-drag');
      };
      return dragMoveStart;
    }());
    // 标题栏可以拖拽
    if (titleNode) {
      titleNode.addEventListener('mousedown', dragMoveStart);
    }
    // 背景遮罩
    // 响应鼠标
    if (!button?.ok && !button?.cancel) {
      buttonCollectionNode.parentNode.removeChild(buttonCollectionNode);
    } else {
      if (button.ok) okButton.addEventListener('click', event => {
        if (!event.isTrusted) return;
        button.ok();
      });
      else buttonCollectionNode.removeChild(okButton);
      if (button.cancel) cancelButton.addEventListener('click', event => {
        if (!event.isTrusted) return;
        button.cancel();
      });
      else buttonCollectionNode.removeChild(cancelButton);
    }
    closeButton.addEventListener('click', event => {
      if (!event.isTrusted) return;
      (button?.close ?? hide)();
    });
    mask.addEventListener('click', event => {
      if (!event.isTrusted) return;
      (button?.close ?? hide)();
    });
    // 响应按键
    const keys = event => {
      if (!event.isTrusted) return;
      if (dialogStack[dialogStack.length - 1] !== dialog) return;
      const code = keyboard.event(event);
      if (code === keyboard.code.ENTER && button && button.ok) button.ok(event);
      else if (code === keyboard.code.ESC) {
        (button?.cancel ?? button?.close ?? hide)(event);
      } else return;
      event.stopPropagation();
      event.preventDefault();
    };
    const stopKeys = event => {
      event.stopPropagation();
    };
    // 关闭对话框
    const hide = function () {
      container.classList.add('woo-modal-an--pop-leave-to');
      document.removeEventListener('keydown', keys);
      container.removeEventListener('keypress', stopKeys);
      document.removeEventListener('scroll', resetPos);
      window.removeEventListener('resize', resetPos);
      setTimeout(function () { container.remove(); }, 200);
      dialogStack.splice(dialogStack.indexOf(dialog), 1);
    };
    const resetPosition = function ({ x, y } = {}) {
      if (x == null) x = (window.innerWidth - dialog.clientWidth) / 2;
      if (y == null) y = (window.innerHeight - dialog.clientHeight) / 2;
      setPos({ x, y });
    };
    // 显示对话框
    const show = function ({ x, y } = {}) {
      document.body.appendChild(container);
      resetPosition({ x, y });
      document.addEventListener('keydown', keys);
      container.addEventListener('keypress', stopKeys);
      document.addEventListener('scroll', resetPos);
      window.addEventListener('resize', resetPos);
      document.activeElement.blur();
      setTimeout(function () {
        container.classList.remove('woo-modal-an--pop-enter');
      }, 200);
      dialogStack.push(dialog);
    };
    return { hide, show, resetPosition, dom: dialog };
  };

  const predefinedDialog = (buttons, { icon: defaultIcon }) => {
    /**
     * icon param is deprecated in v7
     * @param {{ id: string, title: string, text: string, icon: string }}
     * @returns {Promise<boolean?>}
     */
    const inner = ({ id, title, text, icon = defaultIcon }) => new Promise(resolve => {
      const render = function (dom) {
        const template = document.createElement('template');
        template.innerHTML = `
<div class="woo-dialog-message yawf-dialog-text"></div>
`;
        const content = document.importNode(template.content.firstElementChild, true);
        content.textContent = text;
        dom.appendChild(content);
      };
      const value = result => () => {
        dialog.hide();
        resolve(result);
      };
      const button = Object.assign({
        close: value(null),
      }, ...Object.keys(buttons).map(key => ({
        [key]: value(buttons[key]),
      })));
      const dialog = ui.dialog({ id, title, render, button });
      dialog.show();
    });
    return inner;
  };

  ui.alert = predefinedDialog({ ok: true }, { icon: 'ask' });
  ui.confirm = predefinedDialog({ ok: true, cancel: false }, { icon: 'question' });

  /**
   * @param {HTMLElement} bubbleContent
   * @param {HTMLElement} reference
   */
  ui.bubble = function (bubbleContent, reference) {
    const bubble = (function () {
      const template = document.createElement('template');
      template.innerHTML = `
<div class="woo-pop-main yawf-bubble">
<div class="yawf-bubble-text"></div>
</div>
`;
      const bubble = document.importNode(template.content.firstElementChild, true);
      if (!(bubbleContent instanceof Node)) {
        bubbleContent = document.createTextNode(bubbleContent + '');
      }
      bubble.querySelector('.yawf-bubble-text').appendChild(bubbleContent);
      return bubble;
    }());
    const referenceList = [];
    const deBound = function (callback) {
      let busy = false;
      return function () {
        if (busy) return; busy = true;
        window.requestAnimationFrame(() => {
          busy = false;
          callback();
        });
      };
    };
    const trackScroll = function (callback) {
      for (let ref = reference; ref; ref = ref.offsetParent) {
        referenceList.push(reference);
        ref.addEventListener('scroll', callback);
      }
    };
    const deTrackScroll = function (callback) {
      referenceList.splice(0).forEach(ref => {
        ref.removeEventListener('scroll', callback);
      });
    };
    const updatePosition = deBound(function () {
      const rect = reference.getClientRects()[0];
      if (!rect) return;
      const top0 = rect.top - bubble.clientHeight - 8;
      const top1 = top0 + window.pageYOffset;
      const top2 = rect.bottom + 8 + window.pageYOffset;
      const left = rect.left - bubble.clientWidth / 2 + rect.width + window.pageXOffset;
      const atTop = top0 > 0;
      const top = atTop ? top1 : top2;
      if (parseInt(bubble.style.left, 10) !== left) {
        bubble.style.left = left + 'px';
      }
      if (parseInt(bubble.style.top, 10) !== top) {
        bubble.style.top = top + 'px';
      }
    });
    const show = function () {
      document.body.appendChild(bubble);
      deTrackScroll(updatePosition);
      trackScroll(updatePosition);
      updatePosition();
    };
    const hide = function () {
      deTrackScroll(updatePosition);
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
    };
    let mouseIn = null;
    const enter = function () {
      setTimeout(() => {
        if (mouseIn === null) show();
        mouseIn = true;
      }, 0);
    };
    const leave = function () {
      mouseIn = false;
      setTimeout(function () {
        if (mouseIn === false) {
          hide();
          mouseIn = null;
        }
      }, 300);
    };
    reference.addEventListener('mouseenter', enter);
    bubble.addEventListener('mouseenter', enter);
    reference.addEventListener('mouseleave', leave);
    bubble.addEventListener('mouseleave', leave);
  };

  const icons = {
    checkbox: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="currentColor" d="M0 0v16h16V0H0zm14.398 2.9a.667.667 0 0 1 .523 1.129l-8.686 8.604c-.26.258-.677.258-.937 0L1.408 8.78a.667.667 0 1 1 .939-.947l3.42 3.39 8.215-8.14a.667.667 0 0 1 .416-.182z"/></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 0a512 512 0 1 0 0 1024A512 512 0 1 0 512 0zm265.393 292.006c16.75-.2 33.417 5.913 46.023 18.418 25.24 25.038 24.694 66.134-1.176 91.795L509.836 712.08a66.95 66.95 0 0 1-43.293 19.467l-.19.01a63.06 63.06 0 0 1-7.584.443c-17.812 0-33.938-7.168-45.604-18.754l-213.22-211.504C188.838 490.25 182 474.623 182 457.412c0-35.4 28.93-64.1 64.62-64.1 17.35 0 33.107 6.783 44.715 17.822l169.58 168.217L730.877 311.6c12.935-12.83 29.766-19.374 46.516-19.584z"/></svg>',
    warn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 0a512 512 0 1 0 0 1024A512 512 0 1 0 512 0zm-1.346 152l2.72.055v.002l.135.004c36.593 1.51 65.803 31.9 65.803 69.193 0 37.24-29.142 67.617-65.816 69.193l.07-.002-.137.006c.022-.001.044-.003.066-.004a68.6 68.6 0 0 1-2.84.059c-37.917 0-68.654-31.004-68.654-69.252S472.737 152 510.654 152zm2.72 249.268c37.882 0 68.627 31.622 68.627 70.61v329.568C582 840.378 551.255 872 513.373 872c-37.937 0-68.627-31.622-68.627-70.555V471.877c0-38.987 30.7-70.61 68.627-70.61z"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 0a512 512 0 1 0 0 1024A512 512 0 1 0 512 0zm-1.373 152c37.937 0 68.627 31.622 68.627 70.555v329.568c0 38.987-30.7 70.61-68.627 70.61-37.882 0-68.627-31.622-68.627-70.61V222.555C442 183.622 472.745 152 510.627 152zm2.72 581.494c37.917 0 68.654 31.004 68.654 69.252S551.263 872 513.346 872a66.69 66.69 0 0 1-2.719-.055v-.002l-.135-.004c-36.593-1.51-65.803-31.9-65.803-69.193 0-37.24 29.142-67.617 65.816-69.193l-.07.002.137-.006c-.022.001-.044.003-.066.004a68.6 68.6 0 0 1 2.84-.059z"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path fill="currentColor" d="M512 0a512 512 0 1 0 0 1024A512 512 0 1 0 512 0zm3.68 162c59.6 0 114.613 21.36 151.307 54.06C703.653 247.832 722 291.424 722 346.803c0 45.415-11.92 82.632-33.92 111.71-5.733 6.26-20.24 19.958-43.2 40.42l-43.814 39.408C571.36 569.78 560 600.485 560 622.266v12.715h-.107c-1.76 27.2-24.587 48.7-52.48 48.7s-50.72-21.502-52.48-48.7h-.398v-12.715c0-34.524 5.492-52.347 18.346-76.88 11.92-24.504 46.453-62.368 106.053-115.025l11.014-12.715c16.506-19.985 24.773-41.765 24.773-64.473 0-29.978-8.266-56.897-24.773-74.158-17.413-17.234-43.092-33.092-74.266-33.092-40.373 0-68.8 22.79-86.213 48.22-15.6 20.883-22.934 50.86-22.934 88.98 0 28.602-23.388 51.758-52.268 51.758-28.853 0-52.266-23.156-52.266-51.758 0-67.196 19.253-119.85 59.6-157.996C401.04 187 447.813 162 515.68 162zm-8.27 573.242a58.08 58.08 0 0 1 1.791.029c32.705.747 58.947 28.83 58.947 63.363s-26.242 62.617-58.88 63.363l-.066.002v-.03c-.534.018-1.16.03-1.79.03-33.255 0-60.215-28.375-60.215-63.38s26.96-63.38 60.215-63.38z"/></svg>',
  };
  const parser = new DOMParser();
  ui.icon = function (type) {
    if (!Object.prototype.hasOwnProperty.call(icons, type)) return null;
    return parser.parseFromString(icons[type], 'image/svg+xml');
  };

  css.append(`
.yawf-dialog.yawf-dialog { position: fixed; transition: none; }
.yawf-dialog .woo-dialog-main { max-width: none; }
.yawf-dialog-text { max-width: 400px; }
.yawf-dialog-title { cursor: move; }
.yawf-dialog-outer { position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background: none repeat scroll 0% 0% rgb(0, 0, 0); opacity: 0.3; z-index: 9999; }
.yawf-dialog.yawf-drag { opacity: 0.67; user-select: none; transition: none; }
.yawf-bubble { max-width: 400px; font-size: 14px; padding: 8px 16px; box-sizing: border-box; }
.yawf-dialog-close { padding: 8px; position: absolute; top: 10px; right: 10px; z-index: 1; cursor: pointer; }
`);

}());
