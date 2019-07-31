; (function () {

  const yawf = window.yawf = window.yawf || {};

  const message = yawf.message;

  const imageViewer = yawf.imageViewer = {};

  imageViewer.open = function ({ images, current }) {
    message.invoke.showImageViewer({ images, current });
  };

}());

