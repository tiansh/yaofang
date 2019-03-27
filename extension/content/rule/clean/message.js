; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const i18n = util.i18n;

  const clean = yawf.rules.clean;

  Object.assign(i18n, {
    cleanMessageGroupTitle: { cn: '隐藏模块 - 消息页面', tw: '隱藏模組 - 消息網頁', en: 'Hide modules - News page' },
    cleanMessageHelp: { cn: '使用小帮助', tw: '使用小幫助', en: 'Tips' },
    cleanMessageFeedback: { cn: '微博意见反馈', tw: '微博意見反饋', en: 'Feedback' },
  });

  clean.CleanGroup('message', () => i18n.cleanMessageGroupTitle);
  clean.CleanRule('help', () => i18n.cleanMessageHelp, 1, '#v6_pl_rightmod_helpat, #v6_pl_rightmod_helpcomment, #v6_pl_rightmod_helplike, #v6_pl_rightmod_helpnotebox, #v6_pl_rightmod_helpfav, #v6_pl_rightmod_helpgroupchatnotice { display: none !important; }');
  clean.CleanRule('feedback', () => i18n.cleanMessageFeedback, 1, '#v6_pl_rightmod_feedback { display: none !important; }');

}());
