document.addEventListener('DOMContentLoaded', function () {

  /** @type {HTMLDivElement} */
  const container = document.getElementById('container');
  /** @type {HTMLImageElement} */
  const viewer = document.getElementById('viewer');
  /** @type {HTMLDivElement} */
  const resizeBar = document.getElementById('resize_bar');
  /** @type {HTMLDivElement} */
  const preview = document.getElementById('preview');

  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>');
  let imageSrc = null;
  const setImageSrc = function (img, src) {
    if (!src) {
      img.src = imageSrc = placeholder;
      return;
    }
    const onError = () => { img.src = src; };
    imageSrc = src;
    fetch(src, { referrer: 'https://weibo.com/' }).then(resp => {
      if (resp.status !== 200) throw Error();
      return resp.blob();
    }).then(blob => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        img.src = reader.result;
      });
      reader.readAsDataURL(blob);
    }, onError);
  };
  const isImagePlaceholder = function (img) {
    return imageSrc === placeholder;
  };

  const images = new URL(location.href).searchParams.getAll('i').map(image => {
    if (!/https?:/.test(image)) throw Error('Invalid url');
    return new URL(image);
  });
  if (images.length === 0) return;
  const isSingleImage = images.length === 1;

  const initPreview = function () {
    if (isSingleImage) {
      document.body.classList.add('single');
      return;
    }
    const list = preview.querySelector('ul');
    images.forEach((image, index) => {
      const previewItem = document.createElement('li');
      previewItem.className = 'preview-item';
      const previewLink = document.createElement('a');
      const previewImage = document.createElement('img');
      setImageSrc(previewImage, String(image).replace(/\/large\//, '/square/'));
      previewItem.dataset.index = index;
      previewLink.href = '#' + (index + 1);
      previewItem.append(previewLink);
      previewLink.append(previewImage);
      list.append(previewItem);
    });
  };

  const setFocus = function () {
    container.focus();
  };

  const modeStringX = ['x-auto', 'x-fit', 'x-center'];
  const modeStringY = ['y-auto', 'y-fit', 'y-center'];
  const cursor = ['cur-zoom-out', 'cur-zoom-in', 'cur-zoom-in', null, 'cur-default'];
  // 0: image larger than container, use scroll bar to view image
  // 1: image larger than container, shrink to fit container
  // 2: image smaller than container, put at center
  const availableViewModes = function () {
    const imageWidth = viewer.naturalWidth;
    const imageHeight = viewer.naturalHeight;
    const containerPadding = 10;
    const containerWidth = container.clientWidth - containerPadding;
    const containerHeight = container.clientHeight - containerPadding;
    const overWidth = imageWidth > containerWidth;
    const overHeight = imageHeight > containerHeight;
    if (!overWidth && !overHeight) return [[2, 2]];
    if (overWidth && overHeight) {
      const ratio = imageWidth * containerHeight / containerWidth / imageHeight;
      if (ratio > 1 / 0.9) {
        return [[1, 1], [0, 0], [0, 1]];
      } else if (ratio > 0.9) {
        return [[1, 1], [0, 0]];
      } else if (ratio > 0.5) {
        return [[1, 1], [0, 0], [1, 0]];
      } else {
        return [[1, 0], [1, 1], [0, 0]];
      }
    }
    if (overHeight) return [[2, 0], [2, 1]];
    if (overWidth) return [[0, 2], [1, 2]];
    return [];
  };

  const setViewMode = function ([x, y]) {
    container.classList.remove(...modeStringX);
    container.classList.remove(...modeStringY);
    container.classList.remove(...cursor);
    container.classList.add(modeStringX[x]);
    container.classList.add(modeStringY[y]);
    container.classList.add(cursor[x * y]);
  };

  const getViewMode = function () {
    const mode = [modeStringX, modeStringY].map(modeString => (
      modeString.findIndex(dMode => container.classList.contains(dMode))
    ));
    if (mode[0] === -1 || mode[1] === -1) return null;
    return mode;
  };

  const resetViewMode = function () {
    setViewMode(availableViewModes()[0]);
  };

  const updateViewMode = function (useNext = true) {
    const current = getViewMode();
    if (!current) {
      resetViewMode();
      return;
    }
    const validModes = availableViewModes();
    const index = validModes.findIndex(mode => mode + '' === current + '');
    if (useNext) {
      setViewMode(validModes[(index + 1) % validModes.length]);
    } else {
      setViewMode(validModes[index === -1 ? 0 : index]);
    }
  };

  const toggleViewMode = function () {
    updateViewMode(true);
  };

  const setLoading = function () {
    const loading = isImagePlaceholder(viewer.src);
    if (loading) container.classList.add('loading');
    else container.classList.remove('loading');
    return loading;
  };

  const showImage = function (index) {
    if (Number(viewer.dataset.index) === index) return;
    viewer.dataset.index = index;
    setImageSrc(viewer.src);
    const url = images[index];
    window.requestAnimationFrame(() => { setImageSrc(viewer, url); });
    container.scrollTop = 0;
    container.scrollLeft = 0;
    const items = Array.from(document.querySelectorAll('.preview-item'));
    Array.from(items).forEach(item => {
      if (+item.dataset.index === index) {
        item.classList.add('current');
      } else {
        item.classList.remove('current');
      }
    });
    setFocus();
  };

  /** @type {['left', 'mid', 'right']} */
  const allPositions = ['left', 'mid', 'right'];
  /** @returns {'left'|'mid'|'right'} */
  const checkMousePosition = function (mouseX) {
    if (isSingleImage) return 'mid';
    const width = container.clientWidth;
    if (mouseX < 100 || mouseX < width * 0.2) return 'left';
    if (mouseX > width - 100 || mouseX > width * 0.8) return 'right';
    return 'mid';
  };

  const updateMouseStyle = function (mouseX) {
    const position = checkMousePosition(mouseX);
    container.classList.remove(...allPositions);
    container.classList.add(position);
  };

  const getCurrentImage = function () {
    return (Number.parseInt(location.hash.slice(1), 10) - 1) || 0;
  };
  const setCurrentImage = function (index) {
    if (images.length === 1) return;
    if (index < 0) setCurrentImage(images.length - 1);
    else if (index >= images.length) setCurrentImage(0);
    else location.hash = '#' + (index + 1);
  };
  const focusImage = function (index) {
    if (images.length === 1) return;
    if (index < 1 || index > images.length) return;
    const items = Array.from(document.querySelectorAll('.preview-item'));
    items[index - 1].querySelector('a').focus();
  };

  const prevImage = function () { setCurrentImage(getCurrentImage() - 1); };
  const nextImage = function () { setCurrentImage(getCurrentImage() + 1); };

  const onContainerClick = function (mouseX) {
    const pos = checkMousePosition(mouseX);
    if (pos === 'left') prevImage();
    if (pos === 'right') nextImage();
    if (pos === 'mid') toggleViewMode();
  };

  const keyBuffer = [];
  const numKeyClear = function () {
    keyBuffer.splice(0, keyBuffer.length);
  };
  const numKey = function (num) {
    keyBuffer.push(num);
    while (keyBuffer.join('') > images.length) keyBuffer.shift();
    const index = Number(keyBuffer.join(''));
    if (index * 10 > images.length) {
      setCurrentImage(index - 1);
      numKeyClear();
    } else {
      focusImage(index);
    }
  };

  const onKeyDown = function (key) {
    if (key >= 48 && key < 58) {
      numKey(key - 48);
    } else {
      numKeyClear();
      if (key === 33) prevImage();
      else if (key === 34) nextImage();
      else return true;
    }
    return false;
  };

  viewer.addEventListener('load', () => { if (!setLoading()) updateViewMode(false); });
  container.addEventListener('mousemove', event => { updateMouseStyle(event.clientX); });
  container.addEventListener('click', event => { onContainerClick(event.clientX); });
  document.addEventListener('keydown', event => { onKeyDown(event.keyCode) || event.preventDefault(); });
  window.addEventListener('hashchange', event => { showImage(getCurrentImage()); });
  window.addEventListener('resize', event => { updateViewMode(false); });

  initPreview();
  if (images.length === 1) {
    showImage(0);
  } else {
    setCurrentImage(getCurrentImage());
    showImage(getCurrentImage());
  }

  let previewHeight = 100;
  const updateResizeBar = function () {
    if (isSingleImage) {
      previewHeight = 0;
    } else {
      if (previewHeight > 200) previewHeight = 200;
      if (previewHeight < 40) previewHeight = 0;
    }
    const contentHeight = window.innerHeight - previewHeight - 20;
    const contentWidth = window.innerWidth - 20;
    document.body.style.setProperty('--preview-size', previewHeight + 'px');
    document.body.style.setProperty('--content-height', contentHeight + 'px');
    document.body.style.setProperty('--content-width', contentWidth + 'px');
  };
  let dragStartY = null, previewHeightBefore = null;
  const dragMove = event => {
    previewHeight = previewHeightBefore + dragStartY - event.clientY;
    updateResizeBar();
  };
  const dragOver = event => {
    document.body.classList.remove('resize-preview');
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseleave', dragCancel);
    document.removeEventListener('mouseup', dragEnd);
  };
  const dragCancel = event => {
    dragOver();
  };
  const dragStart = event => {
    if (event.target !== resizeBar) return;
    dragStartY = event.clientY;
    previewHeightBefore = previewHeight;
    document.body.classList.add('resize-preview');
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseleave', dragCancel);
    document.addEventListener('mouseup', dragEnd);
  };
  const dragEnd = event => {
    previewHeight = previewHeightBefore + dragStartY - event.clientY;
    updateResizeBar();
    dragOver();
  };
  updateResizeBar();
  resizeBar.addEventListener('mousedown', dragStart);
  document.addEventListener('resize', event => { updateResizeBar(); });

});
