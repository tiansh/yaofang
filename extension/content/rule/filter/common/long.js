; (function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const observer = yawf.observer;

  const request = yawf.request;

  const i18n = util.i18n;
  const dom = util.dom;

  /**
   * 统计一条微博的字数
   * 微博的字数英文按半字计算并四舍五入
   * @param {Element} html
   */
  const feedCharacterCount = function (text) {
    const content = text.textContent;
    const charCount = content.length;
    const latinCount = content.replace(/[^\u0020-\u00fe]/g, '').length;
    return Math.ceil(charCount - latinCount / 2);
  };

  Object.assign(i18n, {
    foldText: {
      cn: '收起全文',
    },
    textCount: {
      cn: '（约{1}字）',
      tw: '（約{1}字）',
      en: ' (about {1} characters)',
    },
  });

  observer.feed.onBefore(async function (feed) {
    if (yawf.WEIBO_VERSION !== 6) return Promise.resolve();
    const unfold = Array.from(feed.querySelectorAll('[action-type="fl_unfold"]'));
    // 这段逻辑基于 lib.feed.plugins.moreThan140
    // 包括直接把 HTML 插入进去的逻辑也是根据这段来做的
    const unfolding = unfold.map(async function (button) {
      const text = button.parentNode;
      if (!text.matches('.WB_text')) return;
      if (text.nextElementSibling && text.nextElementSibling.matches('.WB_text')) return;
      const mid = new URLSearchParams(button.getAttribute('action-data')).get('mid');
      const html = await request.getLongText(mid);
      const full = text.cloneNode(false);
      full.setAttribute('node-type', full.getAttribute('node-type') + '_full');
      dom.content(full, html);
      text.parentNode.insertBefore(full, text.nextSibling);
      const charCount = feedCharacterCount(full);
      const lineBreakCount = full.querySelectorAll('br').length;
      const foldButtonContainer = document.createElement('div');
      foldButtonContainer.innerHTML = '<a href="javascript:void(0);" ignore="ignore" class="WB_text_opt" action-type="fl_fold"><i class="W_ficon ficon_arrow_up">d</i></a>';
      const countTip = i18n.textCount.replace('{1}', () => charCount > 1000 ? Math.round(charCount / 100) * 100 : Math.round(charCount / 10) * 10);
      button.insertBefore(document.createTextNode(countTip), button.querySelector('i'));
      // 自动展开不超过指定字数的微博
      const expandLong = yawf.rules.feeds.content.expandLong;
      if (expandLong.getConfig() && expandLong.ref.count.getConfig() >= charCount + lineBreakCount * (expandLong.ref.br.getConfig() - 1)) {
        text.style.display = 'none';
      } else {
        full.style.display = 'none';
        const foldButton = foldButtonContainer.firstChild;
        foldButton.insertBefore(document.createTextNode(i18n.foldText), foldButton.firstChild);
        full.appendChild(foldButton);
      }
    });
    return Promise.all(unfolding).then(() => { });
  });

}());

