; (function () {

  const yawf = window.yawf;

  const pagemenu = yawf.pagemenu = {};

  let containerResolve;
  const containerPromise = new Promise(resolve => {
    containerResolve = resolve;
  });

  let items = [];

  const line = function () {
    const ul = document.createElement('ul');
    ul.innerHTML = '<li class="line S_line1 yawf-config-menuline"></li>';
    return ul.firstChild;
  };

  pagemenu.add = async function ({ title, href = null, onClick, order = Infinity, section = 0 }) {
    const ul = await containerPromise;
    const li = document.createElement('li');
    li.innerHTML = '<a target="_top"></a>';
    const a = li.firstChild;
    a.href = href || 'javascript:void(0);';
    a.textContent = typeof title === 'function' ? title() : title;
    li.addEventListener('click', event => {
      if (!event.isTrusted) return;
      onClick(event);
    });
    const index = items.findIndex(item => item.section > section || item.section === section && item.order > order);
    if (index !== -1) ul.insertBefore(li, items[index].li);
    else ul.appendChild(li);
    if (index > 0 && items[index - 1].section === section) {
      if (li.previousSibling.matches('.line')) ul.removeChild(li.previousSibling);
    }
    if (index !== -1 && items[index].section !== section) {
      if (!li.nextSibling.matches('.line')) ul.insertBefore(line(), li.nextSibling);
    }
    items.splice(index, 0, { li, order, section });
    const setText = function (newText) {
      li.firstChild.textContent = typeof newText === 'function' ? newText() : newText;
    };
    return { dom: li, text: setText };
  };

  pagemenu.ready = function (ul) {
    containerResolve(ul);
  };

}());
