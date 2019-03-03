; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};
  const dom = util.dom = util.dom || {};


  /**
   * @param {string} html
   * @returns {DocumentFragment}
   */
  const parseHtml = function (html) {
    const tag = 'stupid-inner-html-assign-validator';
    const paired = `<${tag}>` + html + `</${tag}>`;
    const dom = new DOMParser().parseFromString(paired, 'text/html');
    const result = dom.querySelector(tag);
    const fragment = document.createDocumentFragment();
    while (result.firstChild) fragment.appendChild(result.firstChild);
    return fragment;
  };

  /**
   * @param {Element} element
   * @param {string} innerHtml
   */
  const stupidInnerHtmlAssign = function (element, innerHtml) {
    const fragment = parseHtml(innerHtml);
    element.innerHTML = '';
    element.appendChild(fragment);
    return element;
  };
  dom.content = stupidInnerHtmlAssign;

}());
