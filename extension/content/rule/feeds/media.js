; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const message = yawf.message;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;

  const media = feeds.media = {};

  i18n.feedMediaGroupTitle = {
    cn: '图片与视频',
    tw: '圖片與視頻',
    en: 'Images &amp; Videos',
  };

  media.media = rule.Group({
    parent: feeds.feeds,
    template: () => i18n.feedMediaGroupTitle,
  });

  Object.assign(i18n, {
    viewOriginal: {
      cn: '查看图片添加“查看原图”链接|打开{{open}}||{{direct}}点击缩略图时直接查看原图',
      hk: '查看圖片添加「查看原圖」連結|打開{{open}}||{{direct}}點擊縮圖時直接查看原圖',
      tw: '查看圖片添加「查看原圖」連結|打開{{open}}||{{direct}}點擊縮圖時直接查看原圖',
      en: 'add "Original Picture" link for images | which targeted to {{open}} || {{direct}} View orignal pictures by clicking on thumbnail'
    },
    viewOriginalPage: { cn: '包含原图的网页', tw: '包含原圖的網頁', en: 'page with original picture' },
    viewOriginalImage: { cn: '原图', tw: '原圖', en: 'original picture' },
    viewOriginalText: { cn: '查看原图', tw: '查看原圖', en: 'Original Picture' },
  });

  const getImagesInfo = function (ref) {
    let container, imgs, img;
    if (ref.matches('.WB_detail .WB_expand_media *')) {
      // 已经展开详情的图片
      container = ref.closest('.WB_detail');
      imgs = Array.from(container.querySelectorAll('.WB_media_wrap .WB_pic img'));
      img = container.querySelector('.WB_media_view img') ||
        container.querySelector('.current img');
      // fallthrough
    } else if (ref.matches('.WB_expand_media .tab_feed_a *')) {
      // 已经展开详情的评论配图
      container = ref.closest('.WB_expand_media');
      img = container.querySelector('.artwork_box img');
      imgs = [img];
      // fallthrough
    } else if (ref.matches('.WB_media_wrap .WB_pic')) {
      // 没有展开详情的图片
      container = ref.closest('.WB_media_wrap');
      imgs = Array.from(container.querySelectorAll('.WB_pic img'));
      img = ref.querySelector('img');
      // fallthrough
    } else if (ref.getAttribute('imagecard')) {
      const pid = new URLSearchParams(ref.getAttribute('imagecard')).get('pid');
      return { images: ['https://wx1.sinaimg.cn/large/' + pid + '.jpg'], current: 0 };
    } else if (ref.href && ref.href.indexOf('javascript:') === -1) {
      return { images: [ref.href], current: 0 };
    } else if (ref.src) {
      return { images: [ref.href], current: 0 };
    } else return null;
    const images = imgs.map(function (img) {
      const src = img.getAttribute('yawf-ori-src') || img.getAttribute('ori-src') || img.src;
      const url = ['https://', new URL(src).host, '/large', src.match(/\/([^/]*)$/g)].join('');
      return url;
    });
    const pid = img && img.src.match(/[^/.]*(?=(?:\.[^/.]*)?$)/)[0];
    const current = images.findIndex(image => image.includes(pid));
    return { images: images, current: current % images.length };
  };


  media.viewOriginal = rule.Rule({
    id: 'viewOriginal',
    parent: media.media,
    template: () => i18n.viewOriginal,
    ref: {
      open: {
        type: 'select',
        initial: 'page',
        select: [
          { value: 'page', text: () => i18n.viewOriginalPage },
          { value: 'image', text: () => i18n.viewOriginalImage },
        ],
      },
      direct: { type: 'boolean' },
    },
    ainit() {
      const open = this.ref.open.getConfig();
      const direct = this.ref.direct.getConfig();
      const showOriginalPage = function ({ images, current }) {
        message.invoke.showImageViewer({ images, current });
      };
      const addImageHandlerLink = function addImageHandlerLink() {
        const viewLargeLinks = Array.from(document.querySelectorAll([
          // 微博配图
          '.WB_feed li a[action-type="widget_photoview"]:not([yawf-view-ori])',
          // 评论配图
          '.WB_feed li a[action-type="widget_commentPhotoView"]:not([yawf-view-ori])',
        ].join(',')));
        viewLargeLinks.forEach(viewLargeLink => {
          viewLargeLink.setAttribute('yawf-view-ori', '');
          const viewOriginalLinkContainer = document.createElement('ul');
          viewOriginalLinkContainer.innerHTML = '<li><span class="line S_line1"><a class="S_txt1" href="javascript:;" target="_blank"><i class="W_ficon ficon_search S_ficon">l</i></a></span></li>';
          viewOriginalLinkContainer.querySelector('i').after(i18n.viewOriginalText);
          const viewOriginalLink = viewOriginalLinkContainer.querySelector('a');
          viewLargeLink.closest('li').after(viewOriginalLinkContainer.firstChild);
          let images, current;
          const update = function () {
            ({ images, current } = getImagesInfo(viewLargeLink));
            viewOriginalLink.href = images[current];
          };
          viewOriginalLink.addEventListener('click', event => {
            if (open === 'page') {
              showOriginalPage({ images, current });
              event.preventDefault();
            }
          });
          (new MutationObserver(update)).observe(viewLargeLink, { attributes: true });
          update();
        });
      };
      observer.add(addImageHandlerLink);

      if (direct) {
        document.addEventListener('click', function (event) {
          const target = event.target;
          if (event.button !== 0) return; // 只响应左键操作
          if (event.shiftKey) return; // 按下 Shift 时不响应
          const pic = target.closest('.WB_media_wrap .WB_pic') || target.closest('a[imagecard]');
          if (!pic) return;
          event.stopPropagation();
          const { images, current } = getImagesInfo(pic);
          showOriginalPage({ images, current });
        }, true);
      }
    },
  });

}());
