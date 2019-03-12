; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;
  const observer = yawf.observer;
  const message = yawf.message;

  const feeds = yawf.rules.feeds;

  const i18n = util.i18n;
  const css = util.css;
  const urls = util.urls;

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
      en: 'add "Original Picture" link for images | which targeted to {{open}} || {{direct}} View orignal pictures by clicking on thumbnail',
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
      observer.dom.add(addImageHandlerLink);

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
      i: { type: 'bubble', icon: 'warn', template: () => i18n.pauseAnimatedImage },
    },
    ainit() {
      const emptyImage = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
      observer.dom.add(function pauseAnimatedImage() {
        const images = Array.from(document.querySelectorAll([
          '.PCD_photolist img[src$=".gif"]:not([yawf-pause-animate])',
          '.WB_pic img[src$=".gif"]:not([yawf-pause-animate])',
        ].join(',')));
        images.forEach(async function (image) {
          const url = image.src;
          image.src = emptyImage;
          image.setAttribute('ori-src', url);
          image.setAttribute('yawf-ori-src', url);
          image.setAttribute('yawf-pause-animate', 'yawf-pause-animate');
          const dataUrl = await fetch(url).then(resp => resp.blob()).then(blob => urls.blobToDataUrl(blob));
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
    useBuiltInVideoPlayer: { cn: '使用浏览器原生视频播放器{{i}}', hk: '使用瀏覽器內建影片播放器{{i}}', tw: '使用瀏覽器內建影片播放器{{i}}', en: 'Use browser built-in video player {{i}}' },
    useBuiltInVideoPlayerDetail: { cn: '一次性解决自动播放和交互逻辑的各种问题，开启时其他视频相关的改造功能不再生效。不支持直播视频。播放可能不会被微博正确计入播放数。' },
    mediaVideoType: { cn: '视频', hk: '影片', tw: '影片', en: 'Video' },
  });

  media.useBuiltInVideoPlayer = rule.Rule({
    id: 'feed_built_in_video_player',
    version: 1,
    parent: media.media,
    template: () => i18n.useBuiltInVideoPlayer,
    ref: {
      i: { type: 'bubble', icon: 'warn', template: () => i18n.useBuiltInVideoPlayerDetail },
    },
    ainit() {
      const replaceWeiboVideoPlayer = function replaceWeiboVideoPlayer() {
        const containers = document.querySelectorAll('li.WB_video[node-type="fl_h5_video"][video-sources]');
        containers.forEach(function (container) {
          const smallImage = yawf.rules.feeds.layout.smallImage.getConfig();
          const cover = container.querySelector('[node-type="fl_h5_video_pre"] img');
          if (!cover) return;
          const video = container.querySelector('video');
          if (video) video.src = 'data:text/plain,42';
          const videoSourceData = new URLSearchParams(container.getAttribute('video-sources'));
          const videoSource = videoSourceData.get(videoSourceData.get('qType'));
          const newContainer = document.createElement('li');
          newContainer.className = container.className;
          newContainer.classList.add('yawf-WB_video');
          const newVideo = document.createElement('video');
          newVideo.poster = cover.src;
          newVideo.src = videoSource.replace(/^http:/, 'https:');
          newVideo.preload = 'none';
          newVideo.controls = !smallImage;
          newVideo.autoplay = false;
          const updatePlayState = function () {
            const isPlaying = !newVideo.paused || newVideo.seeking;
            if (isPlaying) newContainer.setAttribute('yawf-video-play', '');
            else newContainer.removeAttribute('yawf-video-play');
            if (smallImage) newVideo.controls = isPlaying;
          };
          newVideo.addEventListener('play', updatePlayState);
          newVideo.addEventListener('pause', updatePlayState);
          if (smallImage) {
            newContainer.addEventListener('click', event => {
              if (!newContainer.hasAttribute('yawf-video-play')) newVideo.play();
            });
            const tip = document.createElement('i');
            tip.className = 'W_icon_tag_v2';
            tip.textContent = i18n.mediaVideoType;
            newContainer.appendChild(tip);
          }
          newContainer.appendChild(newVideo);
          container.parentNode.replaceChild(newContainer, container);
        });
      };
      observer.dom.add(replaceWeiboVideoPlayer);
      css.append(`
li.WB_video[node-type="fl_h5_video"][video-sources] > div[node-type="fl_h5_video_pre"],
li.WB_video[node-type="fl_h5_video"][video-sources] > div[node-type="fl_h5_video_disp"] { display: none !important; }
.yawf-WB_video { transition: width, height 0.2s; }
.yawf-WB_video video { width: 100%; height: 100%; position: absolute; top: 0; bottom: 0; left: 0; right: 0; margin: auto; }
.WB_media_a .WB_video.yawf-WB_video { cursor: unset; }
.yawf-WB_video .W_icon_tag_v2 { z-index: 1; }
.WB_video[yawf-video-play] .W_icon_tag_v2 { display: none; }
`);
      util.inject(function () {
        const FakeVideoPlayer = function e() { };
        FakeVideoPlayer.prototype.thumbnail = function () { };
        FakeVideoPlayer.prototype.playStatus = function () { };
        if (window.VideoPlayer) {
          window.VideoPlayer = FakeVideoPlayer;
          return;
        }
        let globalVideoPlayer = void 0;
        Object.defineProperty(window, 'VideoPlayer', {
          get() { return globalVideoPlayer; },
          set(_) { globalVideoPlayer = FakeVideoPlayer; },
          enumerable: true,
          configurable: false,
        });
      });
      // 这几行分别是不显示视频弹层按钮，显示全屏按钮，以及点视频时不弹层
      // 因为直播视频没办法替换成原生播放器，所以这两个功能还需要保留
      // 这里直接把这几个功能放在这里，不单独做一个功能了
      css.append(`
.wbv-pop-control { display: none !important; }
.wbv-fullscreen-control { display: block !important; }
.wbv-pop-layer { display: none !important; }
`);
    },
  });

}());
