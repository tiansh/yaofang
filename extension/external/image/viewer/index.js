document.addEventListener('DOMContentLoaded', function () {

  /** @type {HTMLDivElement} */
  const container = document.getElementById('container');
  /** @type {HTMLImageElement} */
  const viewer = document.getElementById('viewer');
  /** @type {HTMLDivElement} */
  const resizeBar = document.getElementById('resize_bar');
  /** @type {HTMLDivElement} */
  const preview = document.getElementById('preview');

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
    images.forEach((image, index) => {
      const previewItem = document.createElement('a');
      previewItem.className = 'preview-item';
      const previewImage = document.createElement('img');
      previewImage.src = String(image).replace(/\/large\//, '/square/');
      previewItem.dataset.index = index;
      previewItem.href = '#' + (index + 1);
      previewItem.append(previewImage);
      preview.append(previewItem);
    });
  };

  const setFocus = function () {
    container.focus();
  };

  const modeStringX = ['x-auto', 'x-fit', 'x-center'];
  const modeStringY = ['y-auto', 'y-fit', 'y-center'];
  const cursor = ['cur-zoom-out', 'cur-zoom-in', 'cur-zoom-in', 'cur-default'];
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
      if (ratio > 1 / 0.9) return [[0, 0], [0, 1], [1, 1]];
      if (ratio < 0.9) return [[0, 0], [1, 0], [1, 1]];
      return [[0, 0], [1, 1]];
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
    if (index !== -1 && useNext) {
      setViewMode(validModes[(index + 1) % validModes.length]);
    } else if (index === -1) {
      const fallback = validModes.find(mode => {
        if ((mode[0] === 0) !== (current[0] === 0)) return false;
        if ((mode[1] === 0) !== (current[1] === 0)) return false;
        return true;
      }) || validModes[0];
      setViewMode(fallback);
    }
  };

  const toggleViewMode = function () {
    updateViewMode(true);
  };

  const showImage = function (index) {
    const url = images[index];
    if (viewer.src === url) return;
    viewer.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    viewer.src = url;
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

  const prevImage = function () { setCurrentImage(getCurrentImage() - 1); };
  const nextImage = function () { setCurrentImage(getCurrentImage() + 1); };

  const onContainerClick = function (mouseX) {
    const pos = checkMousePosition(mouseX);
    if (pos === 'left') prevImage();
    if (pos === 'right') nextImage();
    if (pos === 'mid') toggleViewMode();
  };

  const onKeyDown = function (key) {
    switch (true) {
    case key === 33:
      prevImage();
      break;
    case key === 34:
      nextImage();
      break;
    case key > 48 && key <= 48 + images.length:
      setCurrentImage(key - 49);
      break;
    default:
      return true;
    }
    return false;
  };

  viewer.addEventListener('load', () => { updateViewMode(false); });
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
    document.body.style.setProperty('--preview-height', previewHeight + 'px');
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
    console.log(event);
    if (event.target !== resizeBar) return;
    dragStartY = event.clientY;
    previewHeightBefore = previewHeight;
    document.body.classList.add('resize-preview');
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseleave', dragCancel);
    document.addEventListener('mouseup', dragEnd);
  };
  const dragEnd = event => {
    console.log(event);
    previewHeight = previewHeightBefore + dragStartY - event.clientY;
    updateResizeBar();
    dragOver();
  };
  updateResizeBar();
  resizeBar.addEventListener('mousedown', dragStart);
  document.addEventListener('resize', event => { updateResizeBar(); });

});
