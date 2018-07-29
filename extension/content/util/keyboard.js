; (async function () {

  const yawf = window.yawf = window.yawf || {};
  const util = yawf.util = yawf.util || {};
  const keyboard = util.keyboard = {};

  const CTRL = 2 ** 32, SHIFT = CTRL * 2, ALT = SHIFT * 2, META = ALT * 2, KEY = CTRL - 1;
  const namelist = '#0;#1;#2;Cancel;#4;#5;Help;#7;BackSpace;TAB;#10;#11;Clear;Enter;EnterSpecial;#15;;;;Pause;CapsLock;Kana;Eisu;Junja;Final;Hanja;#26;Esc;Convert;Nonconvert;Accept;ModeChange;Space;PageUp;PageDown;End;Home;Left;Up;Right;Down;Select;Print;Execute;PrintScreen;Insert;Delete;#47;0;1;2;3;4;5;6;7;8;9;Colon;Semicolon;LessThan;Equals;GreaterThan;QuestionMark;At;A;B;C;D;E;F;G;H;I;J;K;L;M;N;O;P;Q;R;S;T;U;V;W;X;Y;Z;Win;#92;ContextMenu;#94;Sleep;NumPad0;NumPad1;NumPad2;NumPad3;NumPad4;NumPad5;NumPad6;NumPad7;NumPad8;NumPad9;Multiply;Add;Separator;Subtract;Decimal;Divide;F1;F2;F3;F4;F5;F6;F7;F8;F9;F10;F11;F12;F13;F14;F15;F16;F17;F18;F19;F20;F21;F22;F23;F24;#136;#137;#138;#139;#140;#141;#142;#143;NumLock;ScrollLocK;WIN_OEM_FJ_JISHO;WIN_OEM_FJ_MASSHOU;WIN_OEM_FJ_TOUROKU;WIN_OEM_FJ_LOYA;WIN_OEM_FJ_ROYA;#151;#152;#153;#154;#155;#156;#157;#158;#159;Circumflex;Exclamation;DoubleQuote;Hash;Dollar;Percent;Ampersand;Underscore;OpenParen;CloseParen;Asterisk;Plus;Pipe;HyphenMinus;OpenCurlyBracket;CloseCurlyBracket;Tilde;#177;#178;#179;#180;VolumeMute;VolumeDown;VolumeUp;#184;#185;#186;#187;Comma;#189;Period;Slash;BackQuote;#193;#194;#195;#196;#197;#198;#199;#200;#201;#202;#203;#204;#205;#206;#207;#208;#209;#210;#211;#212;#213;#214;#215;#216;#217;#218;OpenBracket;BackSlash;CloseBracket;Quote;#223;;AltGr;#226;WIN_ICO_HELP;WIN_ICO_00;#229;WIN_ICO_CLEAR;#231;#232;WIN_OEM_RESET;WIN_OEM_JUMP;WIN_OEM_PA1;WIN_OEM_PA2;WIN_OEM_PA3;WIN_OEM_WSCTRL;WIN_OEM_CUSEL;WIN_OEM_ATTN;WIN_OEM_FINISH;WIN_OEM_COPY;WIN_OEM_AUTO;WIN_OEM_ENLW;WIN_OEM_BACKTAB;Attn;Crsel;Exsel;Ereof;Play;Zoom;#252;PA1;WIN_OEM_CLEAR;#255'.split(';');

  // 一些常用常量
  keyboard.code = Object.assign(...namelist.map((name, index) => ({ [name.toUpperCase()]: index })));
  keyboard.alter = { CTRL, SHIFT, ALT, META, KEY };

  // 对一个按键事件做编号
  keyboard.event = function (e) {
    if (!e || !e.keyCode) return null;
    return e.keyCode & KEY |
      (e.ctrlKey * CTRL) |
      (e.shiftKey * SHIFT) |
      (e.altKey * ALT) |
      (e.metaKey * META);
  };
  // 给一个编号，转换为键名
  keyboard.name = function (n) {
    return [
      n & CTRL ? 'Ctrl' : '',
      n & SHIFT ? 'Shift' : '',
      n & ALT ? 'Alt' : '',
      n & META ? 'Meta' : '',
      namelist[n & KEY] || `#${+n}`,
    ].filter(x => x).join('-');
  };
  // 注册全局监听按键
  const triggers = [];
  keyboard.reg = function (type, key, callback, ignoreInInput) {
    triggers.push({ type, key, callback, ignoreInInput });
  };
  // 监听按键
  const baseEvent = event => {
    const code = keyboard.event(event);
    const inInput = /^select|textarea|input$/.test(event.target.nodeName.toLowerCase());
    const actived = triggers.filter(function (trigger) {
      if (inInput && trigger.ignoreInInput) return false;
      return trigger.type === event.type && trigger.key === code;
    });
    actived.forEach(function (trigger) {
      try {
        trigger.callback(event);
      } catch (e) {
        util.debug('failed to call keyboard callback %o(%o): %o', trigger, event, e);
      }
    });
  };
  ['keydown', 'keypress', 'keyup'].forEach(function (type) {
    document.documentElement.addEventListener(type, baseEvent);
  });

}());
