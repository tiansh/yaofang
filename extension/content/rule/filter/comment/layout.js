; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;

  const comment = yawf.rules.comment;

  const i18n = util.i18n;

  i18n.commentLayoutGroupTitle = {
    cn: '评论展示',
    tw: '評論展示',
    en: 'Commets Layout',
  };

  const layout = comment.layout = {};
  layout.layout = rule.Group({
    parent: comment.comment,
    template: () => i18n.commentLayoutGroupTitle,
  });

  i18n.commentByTime = {
    cn: '查看评论时默认按时间排序（而非热度）',
    tw: '查閱評論時預設按時間排序（而非熱度）',
    en: 'Show newest comments by default (instead of hot comments)',
  };

  layout.commentByTime = rule.Rule({
    id: 'comment_layout_by_time',
    version: 1,
    parent: layout.layout,
    template: () => i18n.commentByTime,
    init() {
      observer.dom.add(function switchToAllComment() {
        const allButtons = Array.from(document.querySelectorAll([
          'a[action-type="feed_list_commentSearch"][action-data*="filter=all"]:not([yawf-all-comment])',
          'a[action-type="search_type"][action-data*="filter=all"]:not([yawf-all-comment])',
        ].join(',')));
        allButtons.forEach(button => {
          button.setAttribute('yawf-all-comment', 'yawf-all-comment');
          if (!button.classList.contains('curr')) button.click();
        });
      });
    },
  });

  i18n.hideSubComment = {
    cn: '折叠二级评论',
    tw: '折疊二級評論',
    en: 'Hide sub comments by default'
  };

  layout.hideSubComment = rule.Rule({
    id: 'comment_layout_hide_sub',
    version: 1,
    parent: layout.layout,
    template: () => i18n.hideSubComment,
    init() {
      observer.dom.add(function hideSubComment() {
        const rootCommentList = Array.from(document.querySelectorAll('.list_li[node-type="root_comment"]:not([yawf-folded-root-comment])'));
        rootCommentList.forEach(rootComment => {
          rootComment.setAttribute('yawf-folded-root-comment', 'yawf-folded-root-comment');

          const feed = rootComment.closest('.WB_feed_type[mid]');
          const reply = rootComment.querySelector('a[action-type="reply"]');
          const childCommentList = Array.from(rootComment.querySelectorAll('.list_ul[node-type="child_comment"]'));

          const commentId = rootComment.getAttribute('comment_id');
          const mid = feed.getAttribute('mid');
          let childCount = 0;

          if (!childCount) do {
            const moreChildLinks = rootComment.querySelectorAll('[node-type="more_child_comment"] a');
            const moreChild = moreChildLinks[moreChildLinks.length - 1];
            if (!moreChild) break;
            const moreChildNumber = moreChild.textContent.match(/\d+/);
            if (!moreChildNumber || !moreChildNumber[0]) break;
            childCount = parseInt(moreChildNumber[0], 10) || 0;
          } while (false);

          if (!childCount) do {
            const childCommentItems = rootComment.querySelectorAll('.list_ul .list_li[comment_id]');
            childCount = childCommentItems.length || 0;
          } while (false);

          if (!childCount) return;

          const container = document.createElement('div');
          container.innerHTML = '<a class="S_txt1" action-type="click_more_child_comment_big" ></a>';
          const unfold = container.firstChild;
          unfold.setAttribute('action-data', `more_comment=big&root_comment_id=${commentId}&is_child_comment=ture&id=${mid}`);
          unfold.textContent = `(${childCount})`;
          reply.after(unfold);

          childCommentList.forEach(childComment => {
            childComment.parentNode.style.display = 'none';
          });
          unfold.addEventListener('click', () => {
            childCommentList.forEach(childComment => {
              childComment.parentNode.style.display = 'block';
            });
          });
        });
      });
    },
  });

}());
