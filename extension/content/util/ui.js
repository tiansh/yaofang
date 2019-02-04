; (async function () {

  const yawf = window.yawf;
  const util = yawf.util = yawf.util || {};

  const keyboard = util.keyboard;
  const i18n = util.i18n;
  const css = util.css;

  const ui = util.ui = util.ui || {};

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

  /**
   * 显示一个对话框
   * @param {{ id: string, title: string, render: Function, button: { [type: string]: Function? }? }}
   */
  ui.dialog = function ({ id, title, render, button }) {
    // 初始化 DOM
    const template = document.createElement('template');
    template.innerHTML = `
<div class="W_layer yawf-dialog">
  <div tabindex="0"></div>
  <div class="content" node-type="autoHeight">
    <div class="W_layer_title yawf-dialog-title" node-type="title"></div>
    <div class="W_layer_close"><a class="W_ficon ficon_close S_ficon yawf-dialog-close" href="javascript:void(0);" node-type="close">X</a></div>
    <div node-type="inner" class="yawf-dialog-content"></div>
    <div class="W_layer_btn S_bg1 yawf-dialog-buttons">
      <a href="javascript:void(0);" class="W_btn_a btn_34px yawf-dialog-button-ok" node-type="ok" action-type="ok"><span></span></a>
      <a href="javascript:void(0);" class="W_btn_b btn_34px yawf-dialog-button-cancel" node-type="cancel" action-type="cancel"><span></span></a>
    </div>
  </div>
</div>
`;
    const dialog = document.importNode(template.content.firstElementChild, true);
    dialog.id = id;
    const titleNode = dialog.querySelector('.yawf-dialog-title');
    const buttonCollectionNode = dialog.querySelector('.yawf-dialog-buttons');
    const okButton = dialog.querySelector('.yawf-dialog-button-ok');
    const cancelButton = dialog.querySelector('.yawf-dialog-button-cancel');
    const closeButton = dialog.querySelector('.yawf-dialog-close');
    const contentNode = dialog.querySelector('.yawf-dialog-content');
    // 填入内容
    titleNode.textContent = title;
    render(contentNode);
    okButton.textContent = i18n.okButtonTitle;
    cancelButton.textContent = i18n.cancelButtonTitle;
    closeButton.title = i18n.closeButtonTitle;
    // 定位对话框的位置
    const lastPos = { x: 0, y: 0 };
    const setPos = function ({ x, y }) {
      const left = Math.min(Math.max(0, x), document.body.clientWidth - dialog.clientWidth - 2);
      const top = Math.min(Math.max(window.pageYOffset, y), window.pageYOffset + window.innerHeight - dialog.clientHeight - 2);
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
          x: event.clientX - mouseStart.x,
          y: event.clientY - mouseStart.y,
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
          x: e.clientX - lastPos.x,
          y: e.clientY - lastPos.y,
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
    const cover = document.createElement('div');
    cover.setAttribute('node-type', 'outer');
    cover.className = 'yawf-dialog-outer';
    // 响应鼠标
    if (!button || !button.ok && !button.cancel) {
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
      (button && button.close || hide)();
    });
    // 响应按键
    const keys = event => {
      if (!event.isTrusted) return;
      const code = keyboard.event(event);
      if (code === keyboard.code.ENTER && button && button.ok) button.ok(event);
      else if (code === keyboard.code.ESC) {
        (button && (button.cancel || button.close) || (() => hide()))(event);
      } else return;
      event.stopPropagation();
      event.preventDefault();
    };
    // 关闭对话框
    const hide = function () {
      dialog.classList.add('UI_animated', 'UI_speed_fast', 'UI_ani_bounceOut');
      document.removeEventListener('keydown', keys);
      document.removeEventListener('scroll', resetPos);
      window.removeEventListener('resize', resetPos);
      document.body.removeChild(cover);
      setTimeout(function () { document.body.removeChild(dialog); }, 200);
    };
    // 显示对话框
    const show = function ({ x, y } = {}) {
      document.body.appendChild(cover);
      document.body.appendChild(dialog);
      if (x == null) x = (window.innerWidth - dialog.clientWidth) / 2;
      if (y == null) y = (window.innerHeight - dialog.clientHeight) / 2;
      setPos({ x, y: y + window.pageYOffset });
      document.addEventListener('keydown', keys);
      document.addEventListener('scroll', resetPos);
      window.addEventListener('resize', resetPos);
      document.activeElement.blur();
      dialog.classList.remove('UI_ani_bounceOut');
      dialog.classList.add('UI_animated', 'UI_speed_fast', 'UI_ani_bounceIn');
      setTimeout(function () {
        dialog.classList.remove('UI_animated', 'UI_speed_fast', 'UI_ani_bounceIn');
      }, 200);
    };
    return { hide, show, dom: dialog };
  };

  const predefinedDialog = (buttons, { icon: defaultIcon }) => {
    /**
     * @param {{ id: string, title: string, text: string, icon: string }}
     * @returns {Promise<boolean?>}
     */
    const inner = ({ id, title, text, icon = defaultIcon }) => new Promise(resolve => {
      const render = function (dom) {
        const template = document.createElement('template');
        template.innerHTML = `
<div class="layer_point">
  <dl class="point clearfix">
    <dt node-type="icon"><span class="W_icon yawf-dialog-icon"></span></dt>
    <dd node-type="text"><p class="S_txt1 yawf-dialog-text"></p></dd>
  </dl>
</div>
`;
        const content = document.importNode(template.content.firstElementChild, true);
        content.querySelector('.yawf-dialog-icon').classList.add(`icon_${icon}B`);
        content.querySelector('.yawf-dialog-text').textContent = text;
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
<div class="W_layer W_layer_pop yawf-bubble">
  <div class="content layer_mini_info">
    <div class="main_txt"></div>
    <div class="W_layer_arrow"><span class="W_arrow_bor" node-type="arrow"><i class="S_line3"></i><em class="S_bg2_br"></em></span><div></div></div>
  </div>
</div>
`;
      const bubble = document.importNode(template.content.firstElementChild, true);
      if (!(bubbleContent instanceof Node)) {
        bubbleContent = document.createTextNode(bubbleContent + '');
      }
      bubble.querySelector('.main_txt').appendChild(bubbleContent);
      return bubble;
    }());
    const arrow = bubble.querySelector('.W_arrow_bor');
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
      const left = rect.left - 32 + rect.width + window.pageXOffset;
      const atTop = top0 > 0;
      const top = atTop ? top1 : top2;
      const addClass = atTop ? 'W_arrow_bor_b' : 'W_arrow_bor_t';
      const removeClass = atTop ? 'W_arrow_bor_t' : 'W_arrow_bor_b';
      if (parseInt(bubble.style.left, 10) !== left) {
        bubble.style.left = left + 'px';
      }
      if (parseInt(bubble.style.top, 10) !== top) {
        bubble.style.top = top + 'px';
      }
      if (!arrow.classList.contains(addClass)) {
        arrow.classList.add(addClass);
      }
      if (arrow.classList.contains(removeClass)) {
        arrow.classList.remove(removeClass);
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
      }, 0);
    };
    reference.addEventListener('mouseenter', enter);
    bubble.addEventListener('mouseenter', enter);
    reference.addEventListener('mouseleave', leave);
    bubble.addEventListener('mouseleave', leave);
  };


  css.append(`
.yawf-dialog-title {
  cursor: move;
}
.yawf-dialog-outer {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background: none repeat scroll 0% 0% rgb(0, 0, 0);
  opacity: 0.3;
  z-index: 9999;
}
.yawf-dialog.yawf-drag {
  opacity: 0.67;
  -moz-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}
.yawf-bubble {
  max-width: 400px;
}
`);

}());
