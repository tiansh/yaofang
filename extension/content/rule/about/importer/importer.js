; (async function () {

  const yawf = window.yawf;
  const importer = yawf.importer = {};

  const parsers = [];

  importer.parsers = {};

  importer.addParser = function (parser) {
    parsers.push(parser);
    importer.parsers[parser.name] = parser;
  };

  importer.parse = function (dataArrayBuffer) {
    for (const parser of parsers) {
      try {
        const config = parser(dataArrayBuffer);
        if (config && typeof config === 'object') return config;
      } catch (e) {
        // reading failed
      }
    }
    return void 0;
  };


}());
