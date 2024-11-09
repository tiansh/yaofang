; (function () {

  const yawf = window.yawf;
  const env = yawf.env;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const request = yawf.request;
  const download = yawf.download;
  const contextmenu = yawf.contextmenu;
  const imageViewer = yawf.imageViewer;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;
  const urls = util.urls;
  const crc = util.crc;

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
    viewOriginal: env.config.contextMenuSupported ? {
      cn: '查看图片添加“查看原图”链接|打开{{open}}||{{direct}}点击缩略图时直接查看原图||{{contextmenu}}添加到右键菜单',
      tw: '查看圖片添加「查看原圖」連結|打開{{open}}||{{direct}}點擊縮圖時直接查看原圖||{{contextmenu}}添加到操作功能表',
      en: 'add "Original Picture" link for images | which targeted to {{open}} || {{direct}} View original pictures by clicking on thumbnail || {{contexmenu}} Add to context menu',
    } : {
      cn: '查看图片添加“查看原图”链接|打开{{open}}||{{direct}}点击缩略图时直接查看原图',
      tw: '查看圖片添加「查看原圖」連結|打開{{open}}||{{direct}}點擊縮圖時直接查看原圖',
      en: 'add "Original Picture" link for images | which targeted to {{open}} || {{direct}} View original pictures by clicking on thumbnail',
    },
    viewOriginalPage: { cn: '包含原图的网页', tw: '包含原圖的網頁', en: 'page with original picture' },
    viewOriginalImage: { cn: '原图', tw: '原圖', en: 'original picture' },
    viewOriginalText: { cn: '查看原图', tw: '查看原圖', en: 'Original Picture' },
    rotateYText: { cn: '左右翻转', tw: '左右翻轉', en: 'rotateY'},
  });

  const getImageUrl = function (img, large) {
    const src = img.getAttribute('yawf-ori-src') || img.getAttribute('ori-src') || img.src;
    if (!large) return src;
    const url = ['https://', new URL(src).host, '/large', src.match(/\/([^/]*)$/g)].join('');
    return url;
  };

  const getUrlByPid = function (pid, size = 'large') {
    if ('wy'.includes(pid[9])) {
      const index = (crc.crc32(pid) & 3) + 1;
      const extension = pid[21] === 'g' ? 'gif' : 'jpg';
      if (pid[9] === 'w') {
        return new URL(`//ww${index}.sinaimg.cn/${size}/${pid}.${extension}`, location);
      } else {
        return new URL(`//wx${index}.sinaimg.cn/${size}/${pid}.${extension}`, location);
      }
    } else {
      return new URL(`//ss1.sinaimg.cn/${size}/${pid}&690`, location);
    }
  };

  const getImagesInfo = function (ref) {
    let container, imgs, img;
    if (ref.matches('.WB_detail .WB_expand_media *')) {
      // 已经展开详情的图片
      container = ref.closest('.WB_detail');
      imgs = Array.from(container.querySelectorAll('.WB_media_wrap .WB_pic img'));
      img = container.querySelector('.media_show_box img') ||
        container.querySelector('.current img');
      if (ref.matches('[action-type="widget_photoview"]')) {
        img = document.createElement('img');
        img.src = getUrlByPid(new URLSearchParams(ref.getAttribute('action-data')).get('pid'));
      }
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
      return { images: [getUrlByPid(pid).href], current: 1 };
    } else if (ref.href?.indexOf('javascript:') === -1) {
      return { images: [ref.href], current: 1 };
    } else if (ref instanceof HTMLImageElement && ref.src) {
      return { images: [getImageUrl(ref, true)], current: 1 };
    } else return null;
    const images = imgs.map(img => getImageUrl(img, true));
    const pid = img && getImageUrl(img).match(/[^/.]*(?=(?:\.[^/.]*)?$)/)[0];
    const current = images.findIndex(image => image.includes(pid)) + 1;
    return { images, current };
  };

  media.viewOriginal = rule.Rule({
    id: 'feed_view_original',
    version: 1,
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
      contextmenu: { type: 'boolean', initial: true },
    },
    init() {
      this.ref.direct.addConfigListener(newValue => {
        if (newValue) media.downloadImage.ref.direct.setConfig(false);
      });

      const viewEnabled = this.isEnabled();
      const viewType = this.ref.open.getConfig();
      const directView = viewEnabled && this.ref.direct.getConfig();
      const contextMenuView = viewEnabled && this.ref.contextmenu.getConfig();

      const downloadImage = media.downloadImage;
      const downloadEnabled = downloadImage.isEnabled();
      const downloadName = downloadImage.ref.name.getConfig();
      const directDownload = downloadEnabled && downloadImage.ref.direct.getConfig();
      const contextMenuDownload = downloadEnabled && downloadImage.ref.contextmenu.getConfig();

      if (!viewEnabled && !downloadEnabled) return;

      // 添加一个左右翻转的按钮（在查看大图旁边）
      const rotateYButton = viewLargeLink => {
        const rotateYLinkContainer = document.createElement('ul');
        rotateYLinkContainer.innerHTML = '<li><span class="line S_line1"><a class="S_txt1" href="javascript:;" target="_blank"><i class="W_ficon ficon_search S_ficon">l</i></a></span></li>';
        rotateYLinkContainer.querySelector('i').after(i18n.rotateYText);
        const link = rotateYLinkContainer.querySelector('a');

        let current;
        const update = function() {

          let ref = viewLargeLink, container, img;
          if (ref.matches('.WB_detail .WB_expand_media *')) {

            // 已经展开详情的图片
            container = ref.closest('.WB_detail');
            img = container.querySelector('.media_show_box img') ||
              container.querySelector('.current img');
          } else if (ref.matches('.WB_expand_media .tab_feed_a *')) {
            // 已经展开详情的评论配图
            container = ref.closest('.WB_expand_media');
            img = container.querySelector('.artwork_box img');
          }

          current = img;
        };
        link.addEventListener('click', event => {
          rotateY(current);
          event.preventDefault();

        });
        (new MutationObserver(update)).observe(link, {
          attributes: true
        });
        update();

        return rotateYLinkContainer.firstChild;
      };      
      
      // 查看原图
      const showOriginalPage = function ({ images, current }) {
        if (viewType !== 'image') {
          imageViewer.open({ images, current });
        } else {
          window.open(images[current - 1]);
        }
      };

      // 添加一个查看原图的按钮（在查看大图旁边）
      const viewOriginalButton = viewLargeLink => {
        const viewOriginalLinkContainer = document.createElement('ul');
        viewOriginalLinkContainer.innerHTML = '<li><span class="line S_line1"><a class="S_txt1" href="javascript:;" target="_blank"><i class="W_ficon ficon_search S_ficon">l</i></a></span></li>';
        viewOriginalLinkContainer.querySelector('i').after(i18n.viewOriginalText);
        const viewOriginalLink = viewOriginalLinkContainer.querySelector('a');
        let images, current;
        const update = function () {
          ({ images, current } = getImagesInfo(viewLargeLink));
          viewOriginalLink.href = images[current - 1];
        };
        viewOriginalLink.addEventListener('click', event => {
          if (viewOriginalLink.classList.contains('S_ficon_dis')) {
            event.preventDefault();
            return;
          }
          if (viewType === 'page') {
            showOriginalPage({ images, current });
            event.preventDefault();
          }
        });
        (new MutationObserver(update)).observe(viewLargeLink, { attributes: true });
        update();
        return viewOriginalLinkContainer.firstChild;
      };

      // 下载图片
      const downloadImages = function (images, ref) {
        const files = images.map((url, index) => {
          const oriFilename = url.slice(url.lastIndexOf('/') + 1);
          let filename = oriFilename;
          if (downloadName !== 'original') {
            const extension = oriFilename.slice(oriFilename.lastIndexOf('.') + 1);
            filename = (index + 1) + '.' + extension;
          }
          const feed = ref.closest('[mid], [omid], [comment_id]');
          const feedId = feed.getAttribute('comment_id') ??
            (ref.closest('.WB_feed_expand') && feed.getAttribute('omid')) ??
            feed.getAttribute('mid') ?? 0;
          const path = 'weibo-images/' + download.filename(feedId) + '/' + filename;
          return { url, filename: path, referrer: 'https://weibo.com/' };
        });
        files.forEach(file => {
          util.debug('download fetch url %s', file.url);
        });
        download.urls(files);
      };

      // 添加一个下载图片的按钮（在查看大图旁边）
      const downloadButton = viewLargeLink => {
        const downloadLinkContainer = document.createElement('ul');
        downloadLinkContainer.innerHTML = '<li><span class="line S_line1"><a class="S_txt1" href="javascript:;" target="_blank"><i class="W_ficon ficon_search S_ficon">|</i></a></span></li>';
        downloadLinkContainer.querySelector('i').after(i18n.downloadImageText);
        const downloadLink = downloadLinkContainer.querySelector('a');
        downloadLink.addEventListener('click', event => {
          if (!downloadLink.classList.contains('S_ficon_dis')) {
            const { images } = getImagesInfo(viewLargeLink);
            downloadImages(images, downloadLink);
          }
          event.preventDefault();
        });
        return downloadLinkContainer.firstChild;
      };

      // 使按钮不可用
      const disableButton = button => {
        const link = button.querySelector('a');
        link.className = 'S_ficon_dis';
        const icon = link.querySelector('i');
        icon.classList.add('S_ficon_dis');
      };

      // 检查展开的图片，添加图片翻转、查看原图和下载的链接
      const addImageHandlerLink = function addImageHandlerLink() {
        const viewLargeLinks = Array.from(document.querySelectorAll([
          // 微博配图
          '.WB_feed li a[action-type="widget_photoview"]:not([yawf-view-ori])',
          // 评论配图
          '.WB_feed li a[action-type="widget_commentPhotoView"]:not([yawf-view-ori])',
        ].join(',')));
        viewLargeLinks.forEach(viewLargeLink => {
          viewLargeLink.setAttribute('yawf-view-ori', '');
          const disabled = viewLargeLink.classList.contains('S_ficon_dis');
          const li = viewLargeLink.closest('li');
          
          const button = rotateYButton(viewLargeLink);
          li.after(button);
          
          if (downloadEnabled) {
            const button = downloadButton(viewLargeLink);
            if (disabled) disableButton(button);
            li.after(button);
          }
          if (viewEnabled) {
            const button = viewOriginalButton(viewLargeLink);
            if (disabled) disableButton(button);
            li.after(button);
          }
        });
      };
      observer.dom.add(addImageHandlerLink);

      // 让鼠标浮上显示图片卡片的链接指向图片
      const imageCardAsLink = function () {
        const imagecards = document.querySelectorAll('a[imagecard]:not([yawf-imagecard-link])');
        if (!imagecards.length) return;
        imagecards.forEach(imagecard => {
          imagecard.setAttribute('yawf-imagecard-link', 'yawf-imagecard-link');
          const pid = new URLSearchParams(imagecard.getAttribute('imagecard')).get('pid');
          const url = getUrlByPid(pid);
          imagecard.href = url;
          imagecard.target = '_blank';
          imagecard.addEventListener('click', event => {
            event.preventDefault();
          });
        });
      };
      observer.dom.add(imageCardAsLink);

      // 处理点击时直接查看原图/下载的情况
      document.addEventListener('click', function (event) {
        const target = event.target;
        if (event.button !== 0) return; // 只响应左键操作
        if (target.closest('.yawf-W_icon_tag_9p')) return; // 展开过多被折叠的图片按钮不响应
        const pic = target.closest('.WB_media_wrap .WB_pic') ?? target.closest('a[imagecard]');
        if (!pic) return;
        const active = (function () {
          const shift = event.shiftKey;
          const ctrl = /mac/i.test(navigator.platform) ? event.metaKey : event.ctrlKey;
          if (shift) return null;
          if (!directView && viewEnabled && ctrl) return 'view';
          if (!directDownload && downloadEnabled && ctrl) return 'download';
          if (directView) return 'view';
          if (directDownload) return 'download';
          return null;
        }());
        if (!active) return;
        event.stopPropagation();
        event.preventDefault();
        const { images, current } = getImagesInfo(pic);
        const isView = directView || !directDownload && viewEnabled;
        if (isView) showOriginalPage({ images, current });
        else downloadImages(images, target);
      }, true);

      // 添加右键菜单支持
      if (env.config.contextMenuSupported && (contextMenuView || contextMenuDownload)) {
        contextmenu.addListener(function (/** @type {MouseEvent} */event) {
          /** @type {Element & EventTarget} */
          const target = event.target;
          const pic = (function () {
            const pic = target.closest('.WB_media_wrap .WB_pic') ?? target.closest('a[imagecard]');
            if (pic) return pic;
            const feed = target.closest('.WB_feed_type');
            if (!feed) return null;
            const feedPic = feed.querySelector('.WB_media_wrap .WB_pic');
            return feedPic;
          }());
          if (!pic || !pic.contains(target)) return [];
          const { images, current } = getImagesInfo(pic);
          const result = [];
          if (contextMenuView) {
            result.push({
              title: i18n.viewOriginalText,
              onclick: () => { showOriginalPage({ images, current }); },
            });
          }
          if (contextMenuDownload) {
            result.push({
              title: i18n.downloadImageText,
              onclick: () => { downloadImages({ images, current }); },
            });
          }
          return result;
        });
      }
    },
  });

  Object.assign(i18n, {
    downloadImage: env.config.contextMenuSupported ? {
      cn: '查看图片添加“批量下载”链接|使用{{name}}文件名保存||{{direct}}点击缩略图时直接开始下载||{{contextmenu}}添加到右键菜单',
      tw: '查看圖片添加「批次下載」連結|使用{{name}}檔名儲存||{{direct}}點擊縮圖時直接開始下載||{{contextmenu}}添加到操作功能表',
      en: 'Add "Batch Download" link for images {{name}}|Use {{name}} filenames || {{direct}} Trigger download by clicking on thumbnail||{{contextmenu}} Add to context menu',
    } : {
      cn: '查看图片添加“批量下载”链接|使用{{name}}文件名保存||{{direct}}点击缩略图时直接开始下载',
      tw: '查看圖片添加「批次下載」連結|使用{{name}}檔名儲存||{{direct}}點擊縮圖時直接開始下載表',
      en: 'Add "Batch Download" link for images {{name}}|Use {{name}} filenames || {{direct}} Trigger download by clicking on thumbnail',
    },
    downloadImageNameOriginal: {
      cn: '原始',
      en: 'original',
    },
    downloadImageNameIndex: {
      cn: '序号',
      tw: '序號',
      en: 'index',
    },
    downloadImageText: {
      cn: '批量下载',
      tw: '批次下載',
      en: 'Batch Download',
    },
  });

  media.downloadImage = rule.Rule({
    id: 'feed_download_image',
    version: 1,
    parent: media.media,
    template: () => i18n.downloadImage,
    ref: {
      name: {
        type: 'select',
        select: [
          { value: 'index', text: () => i18n.downloadImageNameIndex },
          { value: 'original', text: () => i18n.downloadImageNameOriginal },
        ],
      },
      direct: { type: 'boolean' },
      contextmenu: { type: 'boolean', initial: true },
    },
    init() {
      this.ref.direct.addConfigListener(newValue => {
        if (newValue) media.viewOriginal.ref.direct.setConfig(false);
      });
      // 实现在查看原图功能那里
    },
  });

  Object.assign(i18n, {
    imagePreviewMore: { cn: '支持超过 9 张配图的微博{{i}}||预览{{count}}||有图片未显示时{{more}}', tw: '支援超過 9 張配圖的微博顯示{{i}}||預覽{{count}}||有圖片未顯示時{{more}}', en: 'Support feeds with more than 9 images {{i}} || preview {{count}}||with {{more}}' },
    imagePreviewMoreDetail: { cn: '需要打开这个功能，以帮助查看原图、批量下载等功能支持超过 9 张图片的微博。' },
    imagePreviewFirst3x2: { cn: '前 6 张（每行 3 张）', tw: '前 6 張（每列 3 張）', en: 'first 6 (3 each row)' },
    imagePreviewFirst4x2: { cn: '前 8 张（每行 4 张）', tw: '前 8 張（每列 4 張）', en: 'first 8 (4 each row)' },
    imagePreviewFirst3x3: { cn: '前 9 张（每行 3 张）', tw: '前 9 張（每列 3 張）', en: 'first 9 (3 each row)' },
    imagePreviewFirst4x3: { cn: '前 12 张（每行 4 张）', tw: '前 12 張（每列 4 張）', en: 'first 12 (4 each row)' },
    imagePreviewAll3: { cn: '全部图片（每行 3 张）', tw: '全部圖片（每列 3 張）', en: 'all (3 each row)' },
    imagePreviewAll4: { cn: '全部图片（每行 4 张）', tw: '全部圖片（每列 4 張）', en: 'all (4 each row)' },
    imagePreviewUseText: { cn: '在图片后显示展开收起按钮', tw: '在圖片後顯示展開收起按鈕', en: 'show / hide button after images' },
    imagePreviewUseMask: { cn: '最后一张预览显示剩余图片数量', tw: '最後一張預覽顯示剩餘圖片數量', en: 'number of remaining on last image' },
    animatedImage: { cn: '动图' },
    previewAllShow: { cn: '查看全部图片（共 {1} 张）', tw: '閱覽全部圖片（共 {1} 張）', en: 'View all ({1} images)' },
    previewAllFold: { cn: '收起图片', tw: '收起圖片', en: 'Fold images' },
  });

  media.imagePreviewAll = rule.Rule({
    v7Support: true,
    id: 'image_preview_all',
    version: 50,
    parent: media.media,
    template: () => i18n.imagePreviewMore,
    ref: {
      count: {
        type: 'select',
        initial: '3x3',
        select: [
          { value: '3x2', text: () => i18n.imagePreviewFirst3x2 },
          { value: '4x2', text: () => i18n.imagePreviewFirst4x2 },
          { value: '3x3', text: () => i18n.imagePreviewFirst3x3 },
          { value: '4x3', text: () => i18n.imagePreviewFirst4x3 },
          { value: '3x0', text: () => i18n.imagePreviewAll3 },
          { value: '4x0', text: () => i18n.imagePreviewAll4 },
        ],
      },
      more: {
        type: 'select',
        initial: 'text',
        select: [
          { value: 'text', text: () => i18n.imagePreviewUseText },
          { value: 'mask', text: () => i18n.imagePreviewUseMask },
        ],
      },
      i: { type: 'bubble', icon: 'ask', template: () => i18n.imagePreviewMoreDetail },
    },
    init() {
      this.ref.count.addConfigListener(count => {
        const showAll = count.endsWith('0');
        const items = this.ref.more.getRenderItems();
        items.forEach(item => {
          const container = item.parentNode;
          if (showAll) container.style.display = 'none';
          else container.style.display = 'inline';
        });
      });
    },
    ainit() {
      const configs = {
        count: this.ref.count.getConfig(),
        more: this.ref.more.getConfig(),
      };
      util.inject(function (rootKey, configs) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        const col = Number(configs.count.split('x')[0]);
        const row = Number(configs.count.split('x')[1]) || Infinity;

        vueSetup.eachComponentVM('feed-picture', function (vm) {
          Object.defineProperty(vm, 'inlineNum', {
            get: function () {
              return [1, 1, 3, 3, 4, 4, 3, 4, 4, 3][vm.pic_num] || col;
            },
            set: function (v) { },
            enumerable: true,
            configurable: true,
          });
          Object.defineProperty(vm, 'newPics', {
            get: function () {
              if (vm.$parent.data._yawf_PictureShowAll) return vm.pics.slice(0);
              return vm.pics.slice(0, col * row);
            },
            set: function (v) { },
            enumerable: true,
            configurable: true,
          });

          if (!Object.getOwnPropertyDescriptor(vm.$parent.data, '_yawf_PictureShowAll')) {
            vm.$parent.$set(vm.$parent.data, '_yawf_PictureShowAll', false);
          }

          const expand = function (event) {
            vm.$parent.data._yawf_PictureShowAll = true;
            event.stopPropagation();
          };

          vueSetup.transformComponentRender(vm, function (nodeStruct, Nodes) {
            const { removeChild, appendChild, h } = Nodes;
            const moreIcon = nodeStruct.querySelector('x-woo-box-item x-woo-box');
            if (moreIcon) {
              removeChild(moreIcon.parentNode, moreIcon);
            }
            if (vm.$parent.data._yawf_PictureShowAll) {
              // pass
            } else if (this.pic_num > col * row) {
              if (configs.more === 'mask') {
                const lastPic = nodeStruct.querySelector('x-woo-box-item:last-child');
                const mask = h('woo-box', {
                  class: [this.$style.mask, this.$style.focusImg],
                  attrs: { align: 'center', justify: 'center' },
                }, [
                  h('span', {
                    class: this.$style.picNum,
                    on: { click: expand },
                  }, ['+' + (this.pic_num - col * row)]),
                ]);
                appendChild(lastPic, mask);
              } else {
                const more = h('div', {}, [
                  h('a', {
                    class: 'viewpic yawf-feed-detail-content-retweet-size yawf-feed-pic-expand',
                    on: { click: expand },
                  }, [`查看全部图片（共 ${this.pic_num} 张）`]),
                ]);
                appendChild(nodeStruct, more);
              }
            }
          });
          vm.$forceUpdate();
        });
      }, util.inject.rootKey, configs);
      css.append('.yawf-feed-pic-expand, .yawf-feed-pic-expand:hover { cursor: pointer; text-decoration: none; }');
    },
  });

  Object.assign(i18n, {
    pauseAnimatedImage: { cn: '动画图像(GIF)在缩略图显示时保持静止{{i}}', hk: '動畫圖像(GIF)在所圖顯示時保持靜止{{i}}', tw: '動畫圖像(GIF)在所圖顯示時保持靜止{{i}}', en: 'Pause animated thumbnail (GIF) {{i}}' },
    pauseAnimatedImageDetail: { cn: '该功能仅影响显示效果，并不会降低网络数据用量。' },
  });

  media.pauseAnimatedImage = rule.Rule({
    id: 'feed_no_animated_image',
    version: 1,
    parent: media.media,
    template: () => i18n.pauseAnimatedImage,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.pauseAnimatedImageDetail },
    },
    ainit() {
      // 其实不写 encodeURI 效果上也没问题，但是微博转发文字生成看到 > 就会出错
      const emptyImage = encodeURI('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>');
      observer.dom.add(function pauseAnimatedImage() {
        const images = Array.from(document.querySelectorAll([
          '.PCD_photolist img[src$=".gif"]:not([yawf-pause-animate])',
          '.WB_pic img[src$=".gif"]:not([yawf-pause-animate])',
          'img.W_img_face[src$=".gif"]:not([yawf-pause-animate])',
        ].join(',')));
        images.forEach(async function (image) {
          const url = image.src;
          image.src = emptyImage;
          image.setAttribute('ori-src', url);
          image.setAttribute('yawf-ori-src', url);
          image.setAttribute('yawf-pause-animate', 'yawf-pause-animate');
          const dataUrl = await request.getImage(url).then(blob => urls.blobToDataUrl(blob));
          const img = new Image();
          img.addEventListener('load', () => {
            const width = img.naturalWidth, height = img.naturalHeight;
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            image.src = canvas.toDataURL('image/png');
          });
          img.src = dataUrl;
        });
      });
      css.append(`
.PCD_photolist img[src$=".gif"]:not([yawf-pause-animate]),
.WB_pic img[src$=".gif"]:not([yawf-pause-animate]),
.WB_gif_video_box
{ display: none !important; }
.WB_gif_box { visibility: visible !important; }
`);
    },
  });

  Object.assign(i18n, {
    useBuiltInVideoPlayer: {
      cn: '使用浏览器原生视频播放器{{i}}||音量{{volume}}%|{{memorize}}记忆上一次设置的音量||视频质量{{quality}}',
      hk: '使用瀏覽器內建影片播放器{{i}}||音量{{volume}}%|{{memorize}}記住上一次設置的音量||影片品質{{quality}}',
      en: 'Use browser built-in video player {{i}}||Volume {{volume}} | {{memorize}} memorize last volume||Video quality {{quality}}',
    },
    useBuiltInVideoPlayerDetail: { cn: '一次性解决自动播放和交互逻辑的各种问题，开启时其他视频相关的改造功能不再生效。不支持直播视频。播放可能不会被微博正确计入播放数。' },
    mediaVideoType: { cn: '视频', hk: '影片', tw: '影片', en: 'Video' },
    useBuiltInVideoPlayerAutoQuality: { cn: '自动', tw: '自動', en: 'Auto' },
    useBuiltInVideoPlayerBestQuality: { cn: '最佳', en: 'Best' },
  });

  media.useBuiltInVideoPlayer = rule.Rule({
    v7Support: true,
    id: 'feed_built_in_video_player',
    version: 60,
    parent: media.media,
    template: () => i18n.useBuiltInVideoPlayer,
    ref: {
      volume: { type: 'range', min: 0, max: 100, initial: 100 },
      memorize: { type: 'boolean' },
      quality: {
        type: 'select',
        initial: 'auto',
        select: [
          { value: 'auto', text: () => i18n.useBuiltInVideoPlayerAutoQuality },
          { value: 'best', text: () => i18n.useBuiltInVideoPlayerBestQuality },
        ],
      },
      i: { type: 'bubble', icon: 'warn', template: () => i18n.useBuiltInVideoPlayerDetail },
    },
    ainit() {
      const rule = this;
      const configs = {
        memorize: this.ref.memorize.getConfig(),
        volume: this.ref.volume.getConfig(),
        quality: this.ref.quality.getConfig(),
      };

      const updateVolume = function (volume) {
        if (typeof volume !== 'number') return;
        if (volume < 0 || volume > 100 || !Number.isFinite(volume)) return;
        rule.ref.volume.setConfig(Math.round(volume));
      };

      util.inject(function (rootKey, configs, updateVolume) {
        const yawf = window[rootKey];
        const vueSetup = yawf.vueSetup;

        const { quality, memorize } = configs;
        let volume = configs.volume;

        const setVolume = function (video) {
          const target = Math.round(volume) / 100;
          if (video.paused && video.volume !== target) {
            video.volume = target;
          }
        };
        const onClick = function (event) {
          this.isPlaying = true;
          setVolume(event.target);
          this.$refs.video.play();
        };
        const onPlay = function (event) {
          this.isPlaying = true;
          setVolume(event.target);
        };
        const onVolumechange = function (event) {
          if (!memorize) return;
          const video = event.target;
          volume = Math.round(video.volume * 100);
          updateVolume(volume);
          Array.from(document.querySelectorAll('.yawf-feed-video')).forEach(setVolume);
        };
        const onLoadstart = function (event) {
          setVolume(event.target);
        };

        vueSetup.transformComponentsRenderByTagName('feed-video', function (nodeStruct, Nodes) {
          const { removeChild, appendChild, h } = Nodes;

          const isPlaying = this.isPlaying;
          // 去掉原本渲染的视频播放器
          while (nodeStruct.firstChild) {
            removeChild(nodeStruct, nodeStruct.firstChild);
          }
          // 我们自己画一个视频播放器上去
          let url = null;
          if (quality === 'best') try {
            const playback = this.infos.media_info.playback_list.find(x => x.play_info?.url);
            url = playback.play_info.url;
          } catch (e) { /* ignore */ }
          if (!url) url = this.infos.media_info.stream_url;
          const videoWrap = h('div', {
            ref: 'videoWrapper',
            class: [this.$style.videoBox, 'yawf-video-box'],
          }, [h('div', {
            ref: 'videoContainer',
            class: [this.$style.placeholder, 'yawf-video-placeholder'],
          }, [h('div', {
            class: [this.$style.video, 'yawf-video-container'],
          }, [h('div', {
            class: [this.$style.video, 'wbp-video', isPlaying ? 'yawf-feed-video-actived' : null],
          }, [h('video', {
            ref: 'video',
            class: ['yawf-video', 'yawf-feed-video', 'wbpv-tech'],
            attrs: {
              src: url.replace(/^https?:\/\//, '//'),
              poster: this.thumbnail.replace(/^https?:\/\//, '//'),
              preload: 'auto',
              controls: isPlaying ? true : false,
            },
            on: {
              click: isPlaying ? null : onClick.bind(this),
              play: onPlay.bind(this),
              volumechange: onVolumechange.bind(this),
              loadstart: onLoadstart.bind(this),
            },
          })])])])]);
          appendChild(nodeStruct, videoWrap);
        });

      }, util.inject.rootKey, configs, updateVolume);

      css.append(String.raw`
.yawf-feed-video .wbp-video {width: 100%; height: 100%; }
.yawf-feed-video .wbp-video:not(.yawf-feed-video-actived)::before { content: "\e001"; font-family: krvdficon; font-weight: 400; font-style: normal; font-size: 36px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; opacity: 0.85; text-shadow: 0 2px 4px rgba(0,0,0,.2); pointer-events: none; }
.yawf-feed-video .wbp-video:not(.yawf-feed-video-actived):hover::before { color: #ff8200; }
.yawf-video-container { position: absolute; top: 0; right: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 8px; overflow: hidden; }
`);

    },
  });

}());
