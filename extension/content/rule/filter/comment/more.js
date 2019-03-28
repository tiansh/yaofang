; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const commentParser = yawf.comment;
  const init = yawf.init;

  const comment = yawf.rules.comment;

  const i18n = util.i18n;

  i18n.commentMoreGroupTitle = {
    cn: '更多',
    tw: '其他',
    en: 'More',
  };

  const more = comment.more = {};
  more.more = rule.Group({
    parent: comment.comment,
    template: () => i18n.moreCommercialGroupTitle,
  });


  i18n.showMyComment = {
    cn: '总是显示我自己发表的评论',
    tw: '總是顯示我自己發表的評論',
    en: 'Always show my comments',
  };

  more.showMyComment = rule.Rule({
    id: 'filter_comment_show_my',
    version: 1,
    parent: more.more,
    template: () => i18n.showMyComment,
    init() {
      const rule = this;
      observer.comment.filter(function showMyComment(comment) {
        if (!rule.isEnabled()) return null;
        const author = commentParser.user.name(comment)[0];
        const username = init.page.$CONFIG.nick;
        if (author === username) return 'shomme';
        return null;
      });
      this.addConfigListener(() => { observer.comment.rerun(); });
    },
  });

  i18n.commentFaceCount = {
    cn: '隐藏表情|数量超过{{count}}个的评论',
    tw: '隱藏表情|數量超過{{count}}個的評論',
    en: 'Hide comments | with more than {{count}} face',
  };

  more.commentFaceCount = rule.Rule({
    id: 'filter_comment_face_count',
    version: 1,
    parent: more.more,
    template: () => i18n.commentFaceCount,
    ref: {
      count: {
        type: 'range',
        initial: 8,
        min: 1,
        max: 20,
      },
    },
    init() {
      const rule = this;
      observer.comment.filter(function commentFaceCount(comment) {
        if (!rule.isEnabled()) return null;
        const face = comment.querySelectorAll('img[type="face"][alt]');
        if (face > rule.ref.count.getConfig()) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.comment.rerun(); });
    },
  });

  i18n.commentFaceTypes = {
    cn: '隐藏表情|种类超过{{count}}种的评论',
    tw: '隱藏表情|種類超過{{count}}種的評論',
    en: 'Hide comments | with more than {{count}} kinds of face',
  };

  more.commentFaceTypes = rule.Rule({
    id: 'filter_comment_face_type',
    version: 1,
    parent: more.more,
    template: () => i18n.commentFaceTypes,
    ref: {
      count: {
        type: 'range',
        initial: 4,
        min: 1,
        max: 20,
      },
    },
    init() {
      const rule = this;
      observer.comment.filter(function commentFaceTypes(comment) {
        if (!rule.isEnabled()) return null;
        const face = comment.querySelectorAll('img[type="face"][alt]');
        const types = new Set(Array.from(face).map(face => face.alt)).size;
        if (types > rule.ref.count.getConfig()) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.comment.rerun(); });
    },
  });

  i18n.commentWithoutContent = {
    cn: '隐藏没有内容的评论（只有表情、提到等）',
    tw: '隱藏沒有內容的評論（只有表情、提到等）',
    en: 'Comments without any text content (only mentions and emoji)',
  };

  more.commentWithoutContent = rule.Rule({
    id: 'filter_comment_wo_content',
    version: 1,
    parent: more.more,
    template: () => i18n.commentWithoutContent,
    init() {
      const rule = this;
      observer.comment.filter(function commentWithoutContent(comment) {
        if (!rule.isEnabled()) return null;
        if (comment.querySelector('.media_box .WB_pic')) return null; // 有图片的不算没内容
        const texts = Array.from(comment.querySelector('.WB_text').childNodes)
          .filter(n => !((n instanceof Element) && n.matches('a[usercard]'))) // 提到人不算内容
          .map(n => n.textContent).join('')
          .replace(/回[复復覆]|Reply|[:/\s：]/ig, ''); // 空格、“回复”和冒号不算内容
        if (!texts) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.comment.rerun(); });
    },
  });

  i18n.commentWithForward = {
    cn: '隐藏含有转发消息的微博',
    tw: '隱藏含有轉發消息的微博',
    en: 'Comments contains forwarded messages',
  };

  more.commentWithForward = rule.Rule({
    id: 'filter_comment_with_forward',
    version: 1,
    parent: more.more,
    template: () => i18n.commentWithForward,
    init() {
      const rule = this;
      observer.comment.filter(function commentWithForward(comment) {
        if (!rule.isEnabled()) return null;
        const users = commentParser.user.dom(comment);
        const forwards = users.find(u => u.previousSibling.textContent.match(/\/\/$/));
        if (forwards) return 'hide';
        return null;
      });
      this.addConfigListener(() => { observer.comment.rerun(); });
    },
  });

}());
