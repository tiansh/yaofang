; (function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const crc = util.crc = {};

  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let rem = i >>> 0;
    for (let j = 0; j < 8; j++) {
      if (rem & 1) rem = ((rem >>> 1) ^ 0xedb88320) >>> 0;
      else rem >>>= 1;
    }
    table[i] = rem;
  }

  const parseString = function (str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  };
  
  /**
   * @param {Uint8Array|string} buffer
   * @param {number} crc
   */
  crc.crc32 = function (buffer, crc) {
    const bytes = buffer instanceof Uint8Array ? buffer : parseString(String(buffer));
    crc = ~crc >>> 0;
    bytes.forEach(byte => {
      crc = (crc >>> 8) ^ table[(crc & 0xff) ^ byte];
    });
    crc = ~crc >>> 0;
    return crc;
  };

}());

