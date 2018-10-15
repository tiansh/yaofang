; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const i18n = util.i18n;

  i18n.contentTabTitle = {
    cn: '内容',
    tw: '內容',
    en: 'Content',
  };

  const content = yawf.rules.content = {};
  content.content = rule.Tab({
    template: () => i18n.contentTabTitle,
  });

  const contextMenuSelection = function (target) {
    const selections = window.getSelection();
    if (selections.rangeCount !== 1) return [];
    const text = String(selections).trim();
    if (!text) return [];
    const template = i18n.contentTextContextTitle;
    const contextMenuText = text.length > 10 ? text.slice(0, 9) + '…' : text;
    const title = template.replace('{1}', () => contextMenuText);
    return [{
      title,
      type: 'text',
      value: text,
    }];
  };
  rule.contextMenu(contextMenuSelection);

}());
