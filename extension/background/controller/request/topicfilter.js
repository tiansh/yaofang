; (function () {

  const yawf = window.yawf;
  const message = yawf.message;

  const topicFilter = async function topicFilter(details, hideItems) {
    const { requestId, tabId, url } = details;
    const filter = browser.webRequest.filterResponseData(requestId);
    const capacity = 1 << 24;
    let size = 0;
    let buffer = new ArrayBuffer(capacity);

    filter.ondata = event => {
      const { data } = event;
      if (!buffer) {
        filter.write(data);
        return;
      }
      const length = data.byteLength;
      if (size + length > capacity) {
        filter.write(buffer);
        filter.write(data);
        buffer = null;
        return;
      }
      const view = new Uint8Array(buffer, size, length);
      view.set(new Uint8Array(data));
      size += length;
    };

    filter.onstop = event => {
      try {
        const response = buffer.slice(0, size);
        const decoder = new TextDecoder();
        const responseJson = JSON.parse(decoder.decode(response));
        if (responseJson.code === '100000' && Array.isArray(responseJson.data)) {
          responseJson.data = responseJson.data.filter(({ topic }) => {
            const match = topic.match(/\[(..)\]$/);
            if (!match) return true;
            const typeText = match[1];
            // 这个地方就是没有本地化
            const type = {
              地点: 'place',
              电影: 'movie',
              图书: 'book',
              超话: 'topic',
              音乐: 'music',
              股票: 'stock',
            }[typeText];
            if (hideItems.includes(type)) return false;
            return true;
          });
        }
        const result = JSON.stringify(responseJson);
        const encoder = new TextEncoder();
        const array = encoder.encode(result);
        filter.write(array);
      } catch (e) {
        if (buffer) filter.write(buffer);
      }
      filter.disconnect();
    };

  };

  message.export(topicFilter);
}());
