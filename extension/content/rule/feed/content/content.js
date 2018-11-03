; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const feedParser = yawf.feed;

  const i18n = util.i18n;

  i18n.contentTabTitle = {
    cn: '内容',
    tw: '內容',
    en: 'Content',
  };
  i18n.contentTextContextTitle = {
    cn: '过滤微博 内容“{1}”',
    tw: '篩選微博 內容「{1}」',
    en: 'Create filter for content “{1}”',
  };

  const content = yawf.rules.content = {};
  content.content = rule.Tab({
    template: () => i18n.contentTabTitle,
  });

  const contextMenuSelectionSimple = function (selection) {
    if (!(selection instanceof Selection)) return [];
    if (!(selection + '')) return [];
    if (selection.rangeCount !== 1) return [];
    const [simple] = feedParser.text.simple(selection);
    const full = feedParser.text.full(selection);
    const template = i18n.contentTextContextTitle;
    const title = template.replace('{1}', () => simple);
    return [{ title, type: 'text', value: { simple, full } }];
  };
  rule.addFastListener(contextMenuSelectionSimple);
  const contextMenuSelectionMultiple = function (selection) {
    if (!(selection instanceof Selection)) return [];
    if (selection.rangeCount <= 1) return [];
    const texts = feedParser.text.full(selection).filter(text => text);
    if (!texts.length) return [];
    const template = i18n.contentTextContextTitle;
    const joined = texts.join('…');
    const placeholder = joined.length > 10 ? joined.slice(0, 9) + '…' : joined;
    const title = template.replace('{1}', () => placeholder);
    return [{ title, type: 'multitext', value: { full: texts } }];
  };
  rule.addFastListener(contextMenuSelectionMultiple);

}());
