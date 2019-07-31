; (function () {

  const yawf = window.yawf;
  const importer = yawf.importer;

  importer.addParser(function yaofang(dataArrayBuffer) {
    const decoder = new TextDecoder();
    const text = decoder.decode(dataArrayBuffer);
    const data = JSON.parse(text);
    if (!data.version || !data.yaofang || !data.config) throw TypeError();
    return { config: data.config };
  });

}());
