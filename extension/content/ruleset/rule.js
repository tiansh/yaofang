/**
 * 这个文件用于描述一条规则
 *
 * yawf.rule.<ruleType>(details: object) 新建一条规则
 * <ruleType>:
 *   Rule: 普通规则，普通规则应当属于一个 Group
 *   Text: 纯文本（仅用于展示，一般不承担功能），纯文本是普通规则的一个特例
 *   Tab: 标签页，是最顶层的规则，其中包含若干 Group
 *   Group: 规则分组（小标题），属于一个 Tab，其中包含若干 Rule
 *
 * 普通规则 Rule 是一个 BooleanConfigItem，会默认带一个开关
 *   如果不希望显示开关，则需要在 details 里指定 always: true 此时认为
 *
 * ConfigItem 用于描述一个界面元素，或一个对应的设置项
 * yawf.rule.class.ConfigItem 的构造函数一般不需要从外部调用
 * 一条 Rule 或者 Rule 的 ref 属性，是一个 ConfigItem
 * ref 属性下的 ConfigItem 的类型由构造时对象的 type 属性决定：
 *   boolean: 复选框
 *   select: 下拉单选框
 *   number: 数字输入框
 *   range: 数字输入框和一个范围选择
 *   bubble: 提示文字
 *   strings: 多个字符串
 *   regexen: 多个正则表达式
 *   users: 多个用户（id）
 *   usernames: 多个用户名
 *   topics: 多个话题
 *   key: 一个键盘按键
 *
 * ConfigItem 的属性和方法包括：
 * 显示相关
 *   template() （可选） 用于显示的模板
 *   render(isRoot: boolean) （可选） 显示的函数，如果缺省则使用 template 属性根据规则生成
 *   afterRender(container: Element) （可选） 在调用 render 后可用这个函数对产生的 DOM 做进一步修改
 *   text(isRoot: boolean) （可选） 显示的文本，如果缺省则使用 template 或 render 根据规则生成
 * 设置相关
 *   initial(): any 设置的默认值
 *   normalize(value: any): any 对设置值进行规范化
 *   getConfig(): any 获取设置
 *   setConfig(value: any): any 写入新设置
 *   addConfigListener(callback: (newValue: any, oldValue: any) => void) 当设置改变时回调
 *   removeConfigListener(callback) 取消添加的设置改变的回调
 *
 * BooleanConfigItem 继承自 ConfigItem 包括属性和方法：
 *   always(): boolean = false 如果该属性为 true，那么显示时不带复选框，没有对应的设置项，检查时总是已启用
 *   isEnabled(): boolean 检查是否已启用
 *
 * SelectConfigItem 继承自 ConfigItem
 *   指定 select 属性为 Array<{ name: string, value: string }>，可以用于渲染选择框
 *
 * NumberConfigItem 继承自 ConfigItem
 *   指定 min, max, step 属性，类型 number，可用于输入一个数字
 *
 * RangeConfigItem 继承自 NumberConfigItem
 *   相比 Number 多了一个拖动条以方便输入
 *
 * BubbleConfigItem 继承自 ConfigItem
 *   不存储数据，仅用来展示一个气泡弹窗
 *   使用 icon 属性描述图标类型，模板内容将会渲染到气泡中
 *
 * RuleItem 继承自 BooleanConfigItem 包括属性和方法：
 *   parent 构造时如指定 parent，则会将该规则加入到其父亲的子集合中
 *   children: Array<RuleItem> 构造时自动初始化的数组，用于维护其子集合
 *   type: string = "normal": 规则的类型，用于标记 Tab 和 Group
 *
 * Tab, Group 继承自 RuleItem：
 *   这两个会自动带有 always => true，且有特殊的 type，有特殊的渲染逻辑
 *
 * Rule 继承自 RuleItem，在外部构造时使用 yawf.rule.Rule 构造器构造（无需 new 关键字），包括：
 *   css: string | () => string 这条规则注册的 CSS，无论规则是否启用均会生效
 *   acss: string | () => string 这条规则注册的 CSS，仅启用该条规则后生效
 *   init: () => void 当初始化时调用，无论规则是否启用均会生效
 *   ainit: () => void 当初始化时调用，仅启用该条规则后生效
 *
 * Text 继承自 Rule，在外部构造时使用 yawf.rule.Text 构造器构造（无需 new 关键字）：
 *   实现了特殊的渲染逻辑
 *
 * yawf.rule.tabs: Array<Tab> 用于维护所有注册的标签页
 * yawf.rule.query({
 *   base: Array<RuleItem> = yawf.rule.tabs
 * }): Array<Rule> 用于根据筛选条件列出对应的规则
 */
; (function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const config = yawf.config;
  const init = yawf.init;
  const request = yawf.request;

  const css = util.css;
  const ui = util.ui;
  const i18n = util.i18n;
  const priority = util.priority;
  const keyboard = util.keyboard;

  const rule = yawf.rule = {};
  const rules = yawf.rules = {};
  const tabs = rule.tabs = [];

  rules.all = new Map();
  rule.class = {};
  rule.types = {};

  /**
   * 这里维护一个基本的设置项
   * 我们在这一层维护：
   *   基于 template 属性的通用渲染逻辑
   *   基于 ref 属性的父子关系（用于渲染）
   * @constructor
   * @param {object} self
   */
  const BaseConfigItem = function BaseConfigItem(self) {
    if (!self.ref) self.ref = {};
    Object.keys(self.ref).forEach(key => {
      if (self.ref[key] instanceof BaseConfigItem) return;
      if (!self.ref[key].id) self.ref[key].id = key;
      self.ref[key] = configItemBuilder(self.ref[key], self);
    });
    // 如果使用 Object.assign 将 self 上的内容拷贝到 this 上
    //   将会丢失 self 上的所有的 getter / setter
    //   且当原型上有 setter 时会发生错误
    // 因此我们为 self 设置正确的 __proto__，并直接返回 self
    // 只要子类不在 super 之前访问 this，这样做是很安全的
    // 一般不推荐这种做法，但是这里用起来实在是感觉太好了
    Object.setPrototypeOf(self, Object.getPrototypeOf(this));
    return self;
  };
  /**
   * @returns {string}
   */
  BaseConfigItem.prototype.template = function () { return ''; };

  /** @param {boolean} fullDom */
  const parseTemplate = function (fullDom) {
    /**
     * @typedef {{ type: string, value: string }} TemplateToken
     */
    /** @type {(template: string) => Array<TemplateToken>} */
    const tokenize = function (template) {
      const parseReg = new RegExp([
        String.raw`\{\{([^\}]+)\}\}`, // {{child}}
        String.raw`\[\[([^\]]+)\]\]`, // [[rule]]
        String.raw`(\|\||\|)`, // || or |
        String.raw`([^\|\[\{\&]+|&[^;]+;)`, // text
      ].map(reg => `(?:${reg})`).join('|'), 'g');
      /** @type {string?[][]} */
      const matches = [];
      while (true) {
        const match = parseReg.exec(template);
        if (!match) break;
        matches.push([...match]);
      }
      const tokens = matches.map(([_, ...typed]) => {
        const types = ['child', 'rule', 'splitter', 'text'];
        const index = typed.findIndex(x => x);
        if (index === -1) return null;
        return { type: types[index], value: typed[index] };
      }).filter(token => token);
      return tokens;
    };

    /** @type {(tokens: Array<TemplateToken>, acceptTypes: Iterable<string>) => Array<TemplateToken>} */
    const filteredTokens = function (tokens, acceptTypes) {
      const types = new Set(acceptTypes);
      return tokens.filter(token => token && types.has(token.type));
    };

    /**
     * @typedef {(token: TemplateToken, reference: Node, ref: UiItemCollection) => Node} TemplateTokenRender
     */
    /** @type {Object<string, TemplateTokenRender>} */
    const tokenRender = {};

    /** @type {TemplateTokenRender} */
    tokenRender.child = function (token, reference, ref, mode) {
      const child = ref[token.value];
      if (!child) return reference;
      if (mode !== 'text') {
        const childDom = child.getRenderResult(mode === 'recursive');
        if (childDom instanceof Node) {
          reference.appendChild(childDom);
          return reference;
        } else if (typeof childDom === 'function') {
          return childDom(reference);
        } else return reference;
      } else {
        const text = child.text();
        reference.appendChild(document.createTextNode(text));
        return reference;
      }
    };
    /** @type {TemplateTokenRender} */
    tokenRender.rule = function (token, reference, ref, mode) {
      const refRule = rules.all.get(token.value);
      if (!refRule) {
        util.debug('Referenced rule %s does not found.', token.value);
      }
      if (mode === 'text') {
        reference.appendChild(refRule.text(false));
      } else {
        reference.appendChild(refRule.render(false));
      }
      return reference;
    };
    /** @type {TemplateTokenRender} */
    tokenRender.splitter = function (token, reference, ref, mode) {
      const parent = reference.parentNode;
      const label = document.createElement('label');
      parent.insertBefore(label, reference.nextSibling);
      if (token.value === '||') {
        const br = document.createElement('br');
        parent.insertBefore(br, reference.nextSibling);
      }
      return label;
    };
    /** @type {TemplateTokenRender} */
    tokenRender.text = function (token, reference, ref, mode) {
      const text = token.value.startsWith('&') ? {
        '&amp;': '&',
      }[token.value] : token.value;
      reference.appendChild(document.createTextNode(text));
      return reference;
    };
    /** @type {Array<string>} */
    let acceptTypes = [];
    const itemRender = function (template, ref, mode = null) {
      const types = mode && (acceptTypes = {
        normal: ['child', 'splitter', 'text'],
        recursive: ['child', 'splitter', 'text', 'rule'],
        text: ['child', 'text'],
      }[mode || 'normal']) || acceptTypes.filter(type => type !== 'rule');
      const reference = document.createElement('label');
      const container = document.createElement('span');
      container.classList.add('yawf-config-item');
      container.appendChild(reference);
      const tokens = filteredTokens(tokenize(template), types);
      tokens.reduce((reference, token) => (
        tokenRender[token.type](token, reference, ref, mode)
      ), reference);
      return container;
    };

    const ruleRender = function (isRoot = true) {
      if (!this.template) return null;
      const template = this.template();
      const ref = this.ref;
      const mode = fullDom ? isRoot ? 'recursive' : 'normal' : 'text';
      return itemRender(template, ref, mode);
    };

    return ruleRender;
  };

  /**
   * render 是通用的基于 template 的渲染逻辑
   */
  BaseConfigItem.prototype.render = parseTemplate(true);
  /**
   * text 是通用的检查包含文字的逻辑
   */
  BaseConfigItem.prototype.text = ((parse => function (isRoot = true) {
    let result;
    if (this.template) result = parse.call(this, isRoot);
    else result = this.render(isRoot);
    return result && result.textContent.trim() || '';
  })(parseTemplate(false)));
  /**
   * 渲染包括 render 和一个可选的 afterRender
   * 这里包装两个函数，如果需要重载渲染逻辑，应该重载 render
   * 如果需要获得渲染结果，应该使用这个方法
   */
  BaseConfigItem.prototype.getRenderResult = function (isRoot = true) {
    let node = this.render(isRoot);
    if (typeof this.afterRender === 'function') {
      node = this.afterRender(node);
    }
    return node;
  };

  const nextConfigId = (function () {
    let lastIndex = Math.floor(Math.random() * 1e7) * 10;
    /**
     * @return {string} 返回一个在此次运行中唯一的值，用来标识独立的设置项
     */
    return function () {
      lastIndex += Math.floor(Math.random() * 100);
      const rand = Math.random().toString(36).slice(2);
      const index = lastIndex.toString(36);
      return `yawf-${rand}-${index}`;
    };
  }());

  /**
   * 一个可能带有设置的项目
   * 我们在这一层维护所有和设置有关的内容，包括
   *   设置的读写
   *   设置的合法性验证
   *   设置更新时回调更新数据的渲染逻辑
   */
  class ConfigItem extends BaseConfigItem {
    /**
     * @param {object} item 子设置项
     * @param {ConfigItem} context 父设置项（item 应当在是该设置项的 ref 中）
     */
    constructor(item, context) {
      super(item);
      if (context) {
        this.context = context;
        if (this.id) this.id = context.id + '.' + this.id;
      }
      this.configId = nextConfigId();
      this.configInitialized = false;
    }
    /**
     * @returns {any} 表示设置的初始值
     */
    get initial() { return null; }
    /**
     * @param {any} 未格式化的设置项
     * @returns {any} 根据该设置项允许的取值格式化后的设置项，此时设置项总是合法的
     */
    normalize(value) { return value; }
    /**
     * 重载这个函数来指定使用什么来存储
     * 默认保存在当前用户之下
     */
    get configPool() {
      return config.user;
    }
    /**
     * 初始化设置项
     * 这个函数仅应由 initConfig 调用
     */
    preparConfig() {
      if (this.config) return this.config;
      if (!this.id) throw Error('id is required to init config');
      this.config = this.configPool.key(this.id);
      return this.config;
    }
    /**
     * 一个项目不一定总是需要包含设置项
     * 如果没有调用过任何 getConfig, setConfig 等方法，则不会为该项目分配设置项
     * 在第一次调用任何和设置项相关的方法时，我们试图分配设置项
     */
    initConfig() {
      if (this.configInitialized) return;
      this.configInitialized = true;
      this.preparConfig();
      this.addConfigUiListener();
    }
    /**
     * 初始化设置项变化时对 UI 的反馈
     * 这个函数仅应由 initConfig 调用
     */
    addConfigUiListener() {
      this.initConfig();
      this.config.addListener(newValue => {
        this.renderAllValues();
      });
    }
    /**
     * 读取设置项
     * @return {any} 当前设置项的值
     */
    getConfig() {
      this.initConfig();
      const value = this.config.get();
      const stringifyValue = value == null ? value : JSON.stringify(value);
      const normalize = this.normalize(value);
      const stringifyNormalize = normalize == null ? normalize : JSON.stringify(normalize);
      if (stringifyValue !== stringifyNormalize) {
        this.config.set(normalize);
      }
      return normalize;
    }
    /**
     * 写入设置项
     * @param {any} value 当前设置项的值
     * @return {any} 实际写入的值（经过格式化）
     */
    setConfig(value) {
      this.initConfig();
      const normalize = this.normalize(value);
      this.config.set(normalize);
      return normalize;
    }
    /**
     * 当设置项变化时的回调
     * 注意不要在回调函数中保留设置项渲染出来的文档节点的引用，否则可能造成垃圾回收失效
     * @param {Function} callback 当设置项变化时的回调函数
     * @return {{removeConfigListener: Function}}
     */
    addConfigListener(callback) {
      this.initConfig();
      const { removeListener } = this.config.addListener(callback);
      return { removeConfigListener: removeListener };
    }
    render(...args) {
      const node = super.render(...args);
      // 在渲染时标记该元素的设置 id
      // 当需要更新设置时可以方便地从界面上找到该元素
      node.setAttribute('yawf-config-item', this.configId);
      return node;
    }
    /**
     * 根据设置 id 找到所有该设置项渲染的实例
     */
    getRenderItems() {
      const selector = `[yawf-config-item="${this.configId}"]`;
      return Array.from(document.querySelectorAll(selector));
    }
    /**
     * 更新渲染项的值
     * @param {HTMLElement} container
     */
    renderValue(container) {
      return container;
    }
    /**
     * 更新渲染所有实例
     */
    renderAllValues() {
      const items = this.getRenderItems();
      items.forEach(item => this.renderValue(item));
    }
  }
  rule.class.ConfigItem = ConfigItem;

  /**
   * 一个没有界面的设置项
   */
  class OffscreenConfigItem extends ConfigItem {
    addConfigUiListener() { /* 因为没有 UI，所以什么都不做 */ }
    render() { return null; }
    text() { return ''; }
    getRenderItems() { return null; }
    getRenderResult() { return null; }
    renderValue() { return null; }
  }
  rule.class.OffscreenConfigItem = OffscreenConfigItem;
  rule.types.offscreen = OffscreenConfigItem;

  /**
   * 一个布尔设置项
   * 有个 checkbox
   * 使用默认的渲染逻辑，复选框加到最前面
   */
  class BooleanConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return false; }
    normalize(value) {
      if (value == null) return this.initial;
      return !!value;
    }
    isEnabled() {
      return this.always || this.getConfig();
    }
    render(...args) {
      const container = super.render(...args);
      if (this.always) return container;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      if (yawf.WEIBO_VERSION === 6) {
        checkbox.classList.add('W_checkbox', 'yawf-config-checkbox');
      } else {
        checkbox.classList.add('yawf-config-checkbox');
      }
      checkbox.setAttribute('yawf-config-input', this.configId);
      checkbox.addEventListener('change', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else this.setConfig(checkbox.checked);
      });
      const label = container.querySelector('label');
      label.insertBefore(checkbox, label.firstChild);
      checkbox.checked = this.getConfig();
      if (yawf.WEIBO_VERSION === 7) {
        const contain = document.createElement('span');
        contain.className = 'yawf-config-checkbox-wrap';
        const icon = document.createElement('span');
        icon.className = 'yawf-config-checkbox-icon';
        checkbox.replaceWith(contain);
        contain.append(checkbox);
        contain.append(icon);
        icon.append(ui.icon('checkbox').documentElement);
      }
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `input[type="checkbox"][yawf-config-input="${this.configId}"]`;
      const checkbox = container.querySelector(selector);
      const config = this.getConfig();
      if (checkbox && checkbox.checked !== config) {
        checkbox.checked = config;
      }
      return container;
    }
  }
  rule.class.BooleanConfigItem = BooleanConfigItem;
  rule.types.boolean = BooleanConfigItem;

  /**
   * 一个多选一设置项
   * 有个 select 下拉选择框
   * 需要配置 select 属性为 Array<{ value: string, name: string }> 用于候选项
   * 不使用默认的渲染逻辑
   */
  class SelectConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
      const select = this.select;
      if (!select || !Array.isArray(select) && typeof select.then !== 'function') {
        throw TypeError('`select` attribute is required for select config item');
      }
      if (!Array.isArray(select) && typeof select.then === 'function') {
        Promise.resolve(select).then(items => {
          this.select = items;
          if (this.configInitialized) {
            this.getConfig();
          }
        });
      }
    }
    get initial() {
      const select = this.select;
      if (!select) return null;
      if (!Array.isArray(select)) return null;
      if (!select[0]) return null;
      return select[0].value;
    }
    normalize(value) {
      const select = this.select;
      if (select && !Array.isArray(select) && typeof select.then === 'function') return value;
      if (!select || !Array.isArray(select)) return null;
      if (select.find(item => item.value === value)) return value;
      return this.initial;
    }
    render() {
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-select');
      const select = document.createElement('select');
      if (yawf.WEIBO_VERSION === 7) {
        select.classList.add('woo-input-main');
      }
      const renderOptions = items => {
        items.forEach(({ text, value, style = null }) => {
          const option = document.createElement('option');
          option.value = JSON.stringify(value);
          option.text = typeof text === 'function' ? text() : text;
          if (style) option.style += ';' + style;
          select.add(option);
        });
        select.value = JSON.stringify(this.getConfig());
      };
      if (Array.isArray(this.select)) renderOptions(this.select);
      else Promise.resolve(this.select).then(items => {
        renderOptions(items);
      });
      select.setAttribute('yawf-config-input', this.configId);
      select.addEventListener('change', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else this.setConfig(JSON.parse(select.value));
      });
      container.appendChild(select);
      if (yawf.WEIBO_VERSION === 7) {
        const wrap = document.createElement('div');
        wrap.className = 'woo-input-wrap';
        select.replaceWith(wrap);
        wrap.append(select);
      }
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `select[yawf-config-input="${this.configId}"]`;
      const select = container.querySelector(selector);
      const config = this.getConfig();
      const configStr = JSON.stringify(config);
      if (select && select.value !== configStr) {
        select.value = configStr;
      }
      return container;
    }
  }
  rule.class.SelectConfigItem = SelectConfigItem;
  rule.types.select = SelectConfigItem;

  /**
   * 一个输入框
   * 不暴露给外面直接使用
   */
  class InputConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return ''; }
    get inputType() { return 'text'; }
    normalize(value) { return '' + value; }
    stringify(value) { return '' + value; }
    render() {
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-input');
      const input = document.createElement('input');
      if (yawf.WEIBO_VERSION === 7) {
        input.classList.add('woo-input-main');
      }
      input.type = this.inputType;
      input.value = this.getConfig();
      input.addEventListener('input', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else {
          const token = this.setConfigToken = {};
          setTimeout(() => {
            if (this.setConfigToken !== token) return;
            this.setConfig(input.value);
            if (document.activeElement !== input) {
              this.renderValue(container);
            }
          }, 100);
        }
      });
      input.addEventListener('blur', event => {
        this.renderValue(container);
      });
      input.setAttribute('yawf-config-input', this.configId);
      container.appendChild(input);
      if (yawf.WEIBO_VERSION === 7) {
        const wrap = document.createElement('div');
        wrap.className = 'woo-input-wrap';
        input.replaceWith(wrap);
        wrap.append(input);
      }
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `input[yawf-config-input="${this.configId}"]`;
      const input = container.querySelector(selector);
      const config = this.getConfig();
      const hasFocus = input === document.activeElement;
      if (input && !hasFocus && input.value !== this.stringify(config)) {
        input.value = this.stringify(config);
      }
      return container;
    }
  }
  rule.class.InputConfigItem = InputConfigItem;
  rule.types.input = InputConfigItem;

  /**
   * 一个数字输入框
   * 允许定义 min, max, step 属性
   * 对应一个 number 输入框
   */
  class NumberConfigItem extends InputConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get inputType() { return 'number'; }
    get initial() { return Math.min(Math.max(this.min, 0), this.max); }
    get min() { return 0; }
    get max() { return Infinity; }
    get step() { return 1; }
    normalize(value) {
      let number = +value;
      if (!Number.isFinite(number)) return this.initial;
      if (+this.min === this.min && number < this.min) number = this.min;
      if (+this.max === this.max && number > this.max) number = this.max;
      if (+this.step === this.step && Number.isFinite(this.step)) {
        number -= (number - this.min) % this.step;
      }
      return number;
    }
    render() {
      const container = super.render();
      container.classList.add('yawf-config-number');
      const input = container.querySelector('input');
      if (+this.min === this.min && this.min !== -Infinity) input.min = this.min;
      if (+this.max === this.max && this.max !== Infinity) input.max = this.max;
      if (+this.step === this.step && Number.isFinite(this.step)) input.step = this.step;
      return container;
    }
  }
  rule.class.NumberConfigItem = NumberConfigItem;
  rule.types.number = NumberConfigItem;

  /**
   * 范围输入框
   * 和数字输入框没什么差别，除了多了一个范围拖动条
   * 仅当 min、max 都设置了时才会有效
   */
  class RangeConfigItem extends NumberConfigItem {
    render(...args) {
      const container = super.render(...args);
      container.setAttribute('yawf-config-item', this.configId);
      if (+this.min !== this.min) return container;
      if (!Number.isFinite(this.min)) return container;
      if (+this.max !== this.max) return container;
      if (!Number.isFinite(this.max)) return container;
      if (+this.step !== this.step) return container;
      if (!Number.isFinite(this.step)) return container;
      container.classList.add('yawf-config-range');
      const ranger = document.createElement('span');
      ranger.classList.add('yawf-config-range-wrap');
      const range = document.createElement('input');
      range.type = 'range';
      ranger.appendChild(range);
      container.appendChild(ranger);
      range.min = this.min;
      range.max = this.max;
      range.step = this.step;
      range.addEventListener('input', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else {
          const token = this.setConfigToken = {};
          setTimeout(() => {
            if (this.setConfigToken !== token) return;
            this.setConfig(+range.value);
          }, 100);
        }
      });
      range.addEventListener('blur', event => {
        this.renderValue(container);
      });
      range.value = this.getConfig();
      range.setAttribute('yawf-config-input', this.configId);
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `input[type="range"][yawf-config-input="${this.configId}"]`;
      const range = container.querySelector(selector);
      const config = this.getConfig();
      const hasFocus = range === document.activeElement;
      if (range && !hasFocus && +range.value !== config) {
        range.value = config;
      }
      return container;
    }
  }
  rule.class.RangeConfigItem = RangeConfigItem;
  rule.types.range = RangeConfigItem;

  /**
   * 一个颜色选择框
   * 对应一个 color 输入框
   */
  class ColorConfigItem extends InputConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return '#ffffff'; }
    normalize(value) {
      if (typeof value !== 'string') return this.initial;
      if (!/#[0-9a-f]{6}/i.test(value)) return this.initial;
      return value;
    }
    render() {
      const container = super.render();
      container.classList.add('yawf-config-color');
      const input = container.querySelector('input');
      input.type = 'color';
      return container;
    }
  }
  rule.class.ColorConfigItem = ColorConfigItem;
  rule.types.color = ColorConfigItem;

  i18n.keyboardDisabled = {
    cn: '（已禁用）',
    tw: '（已停用）',
    en: '(Disabled)',
  };

  /**
   * 一个设置按键的设置项
   */
  class KeyboardConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return null; }
    normalize(value) {
      if (value === null) return null;
      if (typeof value !== 'number') return this.initial;
      if (value < 0 || value > keyboard.alter.MAX) return this.initial;
      return value;
    }
    render() {
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-key');
      const button = document.createElement('button');
      if (yawf.WEIBO_VERSION === 7) {
        button.className = 'woo-button-main woo-button-line woo-button-primary woo-button-s woo-button-round';
      }
      button.type = 'button';
      button.textContent = keyboard.name(this.getConfig());
      button.addEventListener('keydown', event => {
        if (!event.isTrusted) return;
        const code = keyboard.event(event);
        if (code === keyboard.code.TAB) return;
        if (code === keyboard.code.TAB + keyboard.alter.SHIFT) return;
        if (code === keyboard.code.ESC) {
          this.setConfig(null);
        } else {
          this.setConfig(code);
        }
        event.preventDefault();
        event.stopPropagation();
      }, true);
      button.setAttribute('yawf-config-input', this.configId);
      container.appendChild(button);
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `button[type="button"][yawf-config-input="${this.configId}"]`;
      const button = container.querySelector(selector);
      const config = this.getConfig();
      const text = config ? keyboard.name(config) : i18n.keyboardDisabled;
      if (button && button.textContent !== text) {
        button.textContent = text;
      }
      return container;
    }
  }
  rule.class.KeyboardConfigItem = KeyboardConfigItem;
  rule.types.key = KeyboardConfigItem;

  /**
   * 一个文本输入框
   * 对应一个 textarea 输入框
   */
  class TextConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return ''; }
    normalize(value) {
      if (typeof value !== 'string') return this.initial;
      return value;
    }
    render() {
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-text');
      const textarea = document.createElement('textarea');
      if (yawf.WEIBO_VERSION === 6) {
        textarea.classList.add('yawf-config-textarea', 'W_input');
      } else {
        textarea.className = 'yawf-config-textarea woo-input-main';
      }
      textarea.value = this.getConfig();
      textarea.addEventListener('input', event => {
        if (!event.isTrusted) textarea.value = this.getConfig();
        else this.setConfig(textarea.value);
      });
      textarea.addEventListener('blur', event => {
        this.renderValue(container);
      });
      textarea.setAttribute('yawf-config-input', this.configId);
      container.appendChild(textarea);
      if (yawf.WEIBO_VERSION === 7) {
        const wrap = document.createElement('div');
        wrap.className = 'woo-input-wrap';
        textarea.replaceWith(wrap);
        wrap.append(textarea);
      }
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `textarea[yawf-config-input="${this.configId}"]`;
      const textarea = container.querySelector(selector);
      const config = this.getConfig();
      if (textarea && textarea.value !== config) {
        textarea.value = config;
      }
      return container;
    }
  }
  rule.class.TextConfigItem = TextConfigItem;
  rule.types.text = TextConfigItem;

  /**
   * 显示一个小图标，鼠标划上去可以显示弹出起泡
   * 这个项目不对应设置值
   */
  class BubbleConfigItem extends BaseConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    render(...args) {
      const content = super.render(...args);
      const contentLabel = content.querySelector('label');
      contentLabel.replaceWith(...Array.from(contentLabel.childNodes));
      const container = document.createElement('span');
      const iconType = this.icon || 'ask';
      let icon;
      if (yawf.WEIBO_VERSION === 6) {
        icon = document.createElement('i');
        icon.classList.add('W_icon', 'yawf-bubble-icon', `icon_${iconType}S`);
      } else {
        const iconTypeV7 = {
          ask: 'help',
          warn: 'warn',
          succ: 'success',
        }[iconType];
        icon = document.createElement('div');
        icon.className = 'yawf-bubble-icon';
        const svg = icon.appendChild(ui.icon(iconTypeV7).documentElement);
        svg.setAttribute('class', `woo-tip-icon woo-tip-${iconTypeV7}Fill`);
      }
      container.appendChild(icon);
      ui.bubble(content, icon);
      return container;
    }
  }
  rule.class.BubbleConfigItem = BubbleConfigItem;
  rule.types.bubble = BubbleConfigItem;

  i18n.collectionAddButton = {
    cn: '添加',
    tw: '新增',
    en: 'Add',
  };

  class CollectionConfigItem extends ConfigItem {
    get initial() { return []; }
    normalize(value) {
      if (!Array.isArray(value)) return [];
      return value.map(item => this.normalizeItem(item)).filter(item => item != null);
    }
    normalizeItem(item) { return item; }
    track(item, index = -1) { return '' + index; }
    renderListitem(item, index) {
      const listitem = document.createElement('li');
      if (yawf.WEIBO_VERSION === 6) {
        listitem.classList.add('yawf-config-collection-item', 'W_btn_b', 'W_btn_tag');
      } else {
        listitem.classList.add('yawf-config-collection-item');
      }
      const track = arguments.length > 1 ? this.track(item, index) : this.track(item);
      listitem.dataset.yawfTrack = track;
      const deleteItem = document.createElement('span');
      deleteItem.classList.add('yawf-config-collection-remove');
      if (yawf.WEIBO_VERSION === 6) {
        deleteItem.innerHTML = '<a class="W_ficon ficon_close S_ficon" href="javascript:void(0);">X</a>';
      } else {
        deleteItem.innerHTML = '<i class="woo-font woo-font--cross" yawf-component-tag="woo-fonticon"></i>';
      }
      listitem.appendChild(deleteItem);
      const content = document.createElement('div');
      content.classList.add('yawf-config-collection-item-content');
      content.appendChild(this.renderItem(item));
      listitem.appendChild(content);
      return listitem;
    }
    render() {
      return reference => {
        /** @type {HTMLLabelElement} */
        const label = reference;
        // 我们渲染一个输入框
        const input = document.createElement('input');
        input.type = 'text';
        if (yawf.WEIBO_VERSION === 6) {
          input.classList.add('yawf-config-collection-input', 'W_input');
        } else {
          input.className = 'yawf-config-collection-input woo-input-main';
        }
        label.appendChild(input);
        if (yawf.WEIBO_VERSION === 7) {
          const wrap = document.createElement('div');
          wrap.className = 'woo-input-wrap';
          input.replaceWith(wrap);
          wrap.append(input);
        }
        // 在当前标签前面藏一个表单元素，用于处理用户输入提交
        const form = document.createElement('form');
        form.classList.add('yawf-config-collection-form');
        form.setAttribute('onsubmit', '');
        label.parentNode.insertBefore(form, label);
        const formId = form.id = nextConfigId();
        input.setAttribute('form', formId);
        // 在当前标签后面放一个提交按钮
        setTimeout(() => {
          const submit = document.createElement('button');
          submit.setAttribute('form', formId);
          if (yawf.WEIBO_VERSION === 6) {
            submit.classList.add('yawf-config-collection-submit', 'W_btn_a');
          } else {
            submit.className = 'yawf-config-collection-submit woo-button-main woo-button-line woo-button-primary woo-button-s woo-button-round';
          }
          submit.textContent = i18n.collectionAddButton;
          label.parentNode.insertBefore(submit, label.nextSibling);
        }, 0);
        // 处理提交时的操作
        form.addEventListener('submit', async event => {
          event.preventDefault();
          event.stopPropagation();
          if (!event.isTrusted) return;
          const userInput = input.value.trim();
          if (!userInput) return;
          input.disabled = true;
          const items = await this.parseUserInput(userInput);
          if (Array.isArray(items)) {
            items.forEach(item => this.addItem(item));
            input.value = '';
          }
          input.disabled = false;
        });
        label.addEventListener('keydown', event => {
          if (!event.isTrusted) return;
          const code = keyboard.event(event);
          if (code === keyboard.code.ENTER) {
            event.stopPropagation();
          }
        });
        if (typeof this.getSuggestionItems === 'function') {
          this.renderSuggestionItems(input);
        }

        // 显示所有项目组成的列表
        const container = document.createElement('div');
        container.classList.add('yawf-config-collection-items');
        container.setAttribute('yawf-config-item', this.configId);
        const list = document.createElement('ul');
        list.classList.add('yawf-config-collection-list');
        container.appendChild(list);
        reference.parentNode.appendChild(container);
        this.getConfig().forEach((item, index) => {
          const listitem = this.renderListitem(item, index);
          list.appendChild(listitem);
        });
        container.addEventListener('click', event => {
          if (!event.isTrusted) return;
          const deleteItem = event.target.closest('.yawf-config-collection-remove');
          if (!deleteItem) return;
          const listitem = deleteItem.parentNode;
          const track = listitem.dataset.yawfTrack;
          this.removeItem(track);
        });
      };
    }
    async parseUserInput(value) {
      return [value];
    }
    async parseFastItem(value, type) {
      return this.parseUserInput(value);
    }
    addItem(value) {
      const values = this.getConfig();
      const track = this.track(value);
      const index = values.findIndex((item, index) => this.track(item, index) === track);
      if (index !== -1) values.splice(index, 1);
      values.push(value);
      this.setConfig(values);
    }
    removeItem(track) {
      const values = this.getConfig();
      const index = values.findIndex((item, index) => this.track(item, index) === track);
      if (index !== -1) values.splice(index, 1);
      this.setConfig(values);
    }
    renderItem(item) {
      return document.createTextNode(item);
    }
    updateItem(container, item) {
      container.textContent = item;
    }
    renderValue(container) {
      const values = this.getConfig();
      const list = container.querySelector('.yawf-config-collection-list');
      const listitems = container.querySelectorAll('.yawf-config-collection-item');
      const listitemMap = new Map();
      [...listitems].forEach(listitem => {
        listitemMap.set(listitem.dataset.yawfTrack, listitem);
      });
      list.innerHTML = '';
      values.forEach((value, index) => {
        const track = this.track(value, index);
        if (listitemMap.has(track)) {
          const listitem = listitemMap.get(track);
          const content = listitem.querySelector('.yawf-config-collection-item-content');
          this.updateItem(content, value);
          list.appendChild(listitem);
        } else {
          const listitem = this.renderListitem(value, index);
          list.appendChild(listitem);
        }
      });
    }
    /**
     * @param {HTMLInputElement} input
     */
    renderSuggestionItems(input) {
      const suggestionContainer = document.createElement('div');
      suggestionContainer.classList.add('layer_menu_list', 'yawf-collection-suggestion');
      const suggestionList = document.createElement('ul');
      suggestionList.classList.add('yawf-collection-suggestion-list');
      suggestionContainer.appendChild(suggestionList);
      /** @type {HTMLLIElement[]} */
      const suggestionItems = [];
      let suggestionItemsShown = false;
      const hideSuggestionItems = () => {
        suggestionItemsShown = false;
        if (!suggestionContainer.parentNode) return;
        suggestionContainer.parentNode.removeChild(suggestionContainer);
      };
      const oldPosition = Array(3).fill(NaN);
      const updatePosition = () => {
        if (!suggestionItemsShown) return;
        const rects = input.getClientRects();
        if (!rects || !rects[0]) return;
        const { left, width, bottom } = rects[0];
        const [oldLeft, oldWidth, oldBottom] = oldPosition;
        if (left !== oldLeft) suggestionContainer.style.left = Math.round(left) + 'px';
        if (width !== oldWidth) suggestionContainer.style.minWidth = (Math.round(width) - 4) + 'px';
        if (bottom !== oldBottom) suggestionContainer.style.top = Math.round(bottom) + 'px';
        oldPosition.splice(0, 3, left, width, bottom);
        window.requestAnimationFrame(updatePosition);
      };
      const showSuggestionItems = items => {
        suggestionList.innerHTML = '';
        suggestionItems.splice(0);
        suggestionItems.push(...items.map(item => {
          const listitem = document.createElement('li');
          listitem.classList.add('yawf-list-suggestion-item');
          listitem.dataset.yawfSuggestionData = JSON.stringify(item);
          const link = document.createElement('a');
          link.href = 'javascript:void(0);';
          listitem.appendChild(link);
          this.renderSuggestionItem(link, item);
          suggestionList.appendChild(listitem);
          return listitem;
        }));
        if (items.length) suggestionContainer.style.display = 'block';
        else suggestionContainer.style.display = 'none';
        if (!suggestionContainer.parentNode) {
          document.body.appendChild(suggestionContainer);
        }
        suggestionItemsShown = true;
        updatePosition();
      };
      const updateInputSuggestion = async () => {
        const userInput = input.value.trim();
        const hasFocus = document.activeElement === input;
        if (!hasFocus) {
          hideSuggestionItems();
        } else {
          const items = await this.getSuggestionItems(userInput);
          if (userInput !== input.value.trim()) return;
          showSuggestionItems(items);
        }
      };
      input.addEventListener('input', updateInputSuggestion);
      input.addEventListener('focus', updateInputSuggestion);
      input.addEventListener('blur', updateInputSuggestion);
      const choseSuggestionListItem = listitem => {
        const item = JSON.parse(listitem.dataset.yawfSuggestionData);
        const normalized = this.normalizeItem(this.parseSuggestionItem(item));
        if (normalized === null) return;
        this.addItem(normalized);
        input.value = '';
        updateInputSuggestion();
      };
      const getFocus = () => suggestionItems.find(item => item.classList.contains('yawf-current'));
      const setFocus = current => suggestionItems.forEach(item => {
        if (item === current) {
          item.classList.add('yawf-current');
          if (yawf.WEIBO_VERSION === 6) item.classList.add('cur');
        } else {
          item.classList.remove('yawf-current');
          if (yawf.WEIBO_VERSION === 6) item.classList.remove('cur');
        }
      });
      const keydownEventHandler = event => {
        const handler = {
          [keyboard.code.ENTER]: () => {
            const current = getFocus();
            if (!current) return;
            choseSuggestionListItem(current);
          },
          [keyboard.code.UP]: () => {
            const old = getFocus();
            const current = old && old.previousSibling || suggestionItems[suggestionItems.length - 1];
            if (current) setFocus(current);
          },
          [keyboard.code.DOWN]: () => {
            const old = getFocus();
            const current = old && old.nextSibling || suggestionItems[0];
            if (current) setFocus(current);
          },
        }[keyboard.event(event)];
        if (!handler) return;
        handler();
        event.preventDefault();
        event.stopPropagation();
      };
      input.addEventListener('keydown', keydownEventHandler);
      suggestionList.addEventListener('mousedown', event => {
        const listitem = event.target.closest('li.yawf-list-suggestion-item');
        choseSuggestionListItem(listitem);
        event.stopPropagation();
        event.preventDefault();
      });
      suggestionList.addEventListener('mouseover', event => {
        if (!(event.target instanceof Element)) return;
        const listitem = event.target.closest('li.yawf-list-suggestion-item');
        setFocus(listitem);
      });
    };
    parseSuggestionItem(item) { return item; }
  }
  rule.class.CollectionConfigItem = CollectionConfigItem;

  class StringCollectionConfigItem extends CollectionConfigItem {
    normalizeItem(item) { return ('' + item).trim(); }
    track(item, index = -1) { return item; }
    render(...args) {
      const render = super.render(...args);
      return reference => {
        render(reference);
        const container = reference.parentNode.querySelector('.yawf-config-collection-items');
        container.classList.add('yawf-config-collection-string');
      };
    }
    updateItem() {
      // track 返回的是字串本身，如果 track 对应字串不应该有变化，所以无需更新
    }
  }
  rule.class.StringCollectionConfigItem = StringCollectionConfigItem;
  rule.types.strings = StringCollectionConfigItem;

  class RegExpCollectionConfigItem extends StringCollectionConfigItem {
    constructor(item, parent) {
      super(item, parent);
      this.configCacheDirty = true;
    }
    initConfig() {
      if (this.configInitialized) return;
      super.initConfig();
      this.addConfigListener(() => {
        this.configCacheDirty = true;
      });
    }
    normalizeItem(value) {
      if (!value || typeof value !== 'object') return null;
      if (typeof value.source !== 'string') return null;
      if (typeof value.flags !== 'string' && value.flags !== void 0) return null;
      const { source, flags } = value;
      return { source, flags };
    }
    track({ source, flags }, index = -1) { return `/${source}/${flags}`; }
    renderItem({ source, flags }) {
      return document.createTextNode(`/${source}/${flags}`);
    }
    async parseUserInput(value) {
      let regexp = null;
      try {
        regexp = new RegExp(...value.match(/^\/(.*)\/([a-zA-Z]*)$/).slice(1));
      } catch (e) {
        try {
          regexp = new RegExp(value, 'mu');
        } catch (e2) { /* empty */ }
      }
      if (!regexp) return null;
      const { source, flags } = regexp;
      if (source === '(?:)') return null;
      return [{ source, flags }];
    }
    // 我们储存一份编译好的正则表达式，这样可以方便使用
    getConfigCompiled() {
      this.updateConfigCache();
      return this.configCache;
    }
    updateConfigCache() {
      if (Array.isArray(this.configCache) && !this.configCacheDirty) return;
      this.rebuildConfigCache();
    }
    setConfig(...args) {
      const result = super.setConfig(...args);
      this.rebuildConfigCacheLater();
      return result;
    }
    rebuildConfigCache() {
      this.configCache = this.getConfig().map(item => this.compileRegExp(item));
      this.configCacheDirty = false;
    }
    rebuildConfigCacheLater() {
      this.configCacheDirty = true;
      setTimeout(() => {
        if (this.configCacheDirty) {
          this.rebuildConfigCache();
        }
      }, 0);
    }
    addItem(value) {
      const values = this.getConfig();
      const track = this.track(value);
      const index = values.findIndex((item, index) => this.track(item, index) === track);
      if (index !== -1) {
        values.splice(index, 1);
      }
      values.push(value);
      super.setConfig(values);
    }
    removeItem(track) {
      const values = this.getConfig();
      const index = values.findIndex((item, index) => this.track(item, index) === track);
      if (index !== -1) {
        values.splice(index, 1);
      }
      super.setConfig(values);
    }
    compileRegExp({ source, flags }) {
      return RegExp(source, flags);
    }
  }
  rule.class.RegExpCollectionConfigItem = RegExpCollectionConfigItem;
  rule.types.regexen = RegExpCollectionConfigItem;

  class UserIdCollectionConfigItem extends CollectionConfigItem {
    normalizeItem(value) {
      if (!value || typeof value !== 'object') return null;
      const id = String(value.id);
      if (!id || !+id) return null;
      return { id };
    }
    track({ id }, index = -1) { return id; }
    render(...args) {
      const render = super.render(...args);
      return reference => {
        render(reference);
        const container = reference.parentNode.querySelector('.yawf-config-collection-items');
        container.classList.add('yawf-config-collection-user-id');
      };
    }
    renderItem({ id }) {
      const useritem = document.createElement('div');
      useritem.classList.add('yawf-config-user-item');
      if (yawf.WEIBO_VERSION === 6) {
        useritem.setAttribute('usercard', `id=${id}`);
      }
      const useravatar = document.createElement('div');
      useravatar.classList.add('yawf-config-user-avatar');
      useritem.appendChild(useravatar);
      const username = document.createElement('div');
      username.classList.add('yawf-config-user-name');
      useritem.appendChild(username);
      request.userInfo({ id }).then(({ name, avatar }) => {
        const img = new Image();
        img.src = avatar;
        img.classList.add('yawf-config-user-avatar-img');
        useravatar.appendChild(img);
        username.textContent = name;
      });
      return useritem;
    }
    async parseUserInput(value) {
      const username = value.replace(/^@/, '');
      const user = await request.userInfo({ name: username });
      if (!user || !user.id) return null;
      return [{ id: user.id }];
    }
    async parseFastItem(value, type) {
      return [value];
    }
    updateItem() {
    }
    async getSuggestionItems(userInput) {
      return request.userSuggest(userInput.replace(/^@/, ''));
    }
    renderSuggestionItem(listitem, item) {
      listitem.appendChild(document.createTextNode(item.name));
    }
  }
  rule.class.UserIdCollectionConfigItem = UserIdCollectionConfigItem;
  rule.types.users = UserIdCollectionConfigItem;

  class UserNameCollectionConfigItem extends StringCollectionConfigItem {
    async getSuggestionItems(userInput) {
      const users = await request.userSuggest(userInput.replace(/^@/, ''));
      return users.map(user => user.name);
    }
    renderSuggestionItem(listitem, item) {
      listitem.appendChild(document.createTextNode(item));
    }
    renderItem(value) {
      return document.createTextNode('@' + value);
    }
    async parseUserInput(userInput) {
      return [userInput.trim().replace(/^@?/, '')];
    }
    async parseFastItem(value) {
      return [value.name];
    }
  }
  rule.class.UserNameCollectionConfigItem = UserNameCollectionConfigItem;
  rule.types.usernames = UserNameCollectionConfigItem;

  class TopicCollectionConfigItem extends StringCollectionConfigItem {
    async getSuggestionItems(userInput) {
      const topics = await request.topicSuggest(userInput.replace(/#/g, ''));
      return topics;
    }
    renderSuggestionItem(listitem, item) {
      listitem.appendChild(document.createTextNode(item));
    }
    renderItem(value) {
      return document.createTextNode('#' + value + '#');
    }
    async parseUserInput(userInput) {
      return [userInput.trim().replace(/#/g, '')];
    }
    async parseFastItem(value) {
      return [value];
    }
  }
  rule.class.TopicCollectionConfigItem = TopicCollectionConfigItem;
  rule.types.topics = TopicCollectionConfigItem;

  class GroupIdCollectionConfigItem extends CollectionConfigItem {
    normalizeItem(value) {
      if (!value || typeof value !== 'object') return null;
      const id = String(value.id);
      return { id };
    }
    track({ id }, index = -1) { return id; }
    render(...args) {
      const render = super.render(...args);
      return reference => {
        render(reference);
        const container = reference.parentNode.querySelector('.yawf-config-collection-items');
        container.classList.add('yawf-config-collection-group-id');
      };
    }
    renderItem(value) {
      const span = document.createElement('span');
      ; (async function () {
        const groups = await request.groupList();
        const group = groups.find(group => group.id === value.id);
        span.textContent = group.name;
      }());
      return span;
    }
    async parseGroupInput(value) {
      const groups = await request.groupList();
      const group = groups.find(group => group.name === value);
      return [{ id: group.id }];
    }
    async parseFastItem(value, type) {
      return [value];
    }
    updateItem() {
    }
    async getSuggestionItems(userInput) {
      const groups = await request.groupList();
      return groups.filter(group => group.name.includes(userInput));
    }
    renderSuggestionItem(listitem, item) {
      listitem.appendChild(document.createTextNode(item.name));
    }
  }
  rule.class.GroupIdCollectionConfigItem = GroupIdCollectionConfigItem;
  rule.types.groups = GroupIdCollectionConfigItem;

  const configItemBuilder = function (item, parent) {
    if (!item) return null;
    const constructor = rule.types[item.type];
    if (!constructor) {
      return new ConfigItem(item, parent);
    } else {
      return new constructor(item, parent);
    }
  };

  /**
   * 描述一个出现在设置窗口中的项目
   */
  class RuleItem extends BooleanConfigItem {
    get type() { return 'normal'; }
    get disabled() { return false; }
    constructor(item) {
      super(item, null);
      if (this.parent) {
        this.parent.children.push(this);
      }
    }
  }

  /**
   * 描述设置窗口的一个标签页
   */
  class Tab extends RuleItem {
    constructor(item) {
      super(item);
      this.children = [];
      tabs.push(this);
    }
    get type() { return 'tab'; }
    get always() { return true; }
    render() {
      const span = document.createElement('span');
      span.textContent = this.template();
      return span;
    }
  }
  rule.Tab = function (item) {
    return new Tab(item);
  };
  rule.class.Tab = Tab;
  // 这个标签页不会在设置窗口中显示，但是会出现在搜索结果里面
  rule.vtab = rule.Tab({ type: 'vtab' });

  /**
   * 描述窗口的一组设置，一组设置有一个加粗文字显示的标题
   */
  class Group extends RuleItem {
    constructor(item) {
      if (!(item.parent instanceof Tab)) {
        throw TypeError('Group must in some Tab');
      }
      super(item);
      this.children = [];
    }
    get type() { return 'group'; }
    get always() { return true; }
    render(...args) {
      const node = super.render(...args);
      node.classList.add('yawf-config-group');
      return node;
    }
  }
  rule.class.Group = Group;
  rule.Group = function (item) {
    return new Group(item);
  };

  /**
   * 描述一条设置
   * 设置会调用 execute 初始化一次
   * 不要重载 execute 实现逻辑，相反，应该重载以下几个属性：
   *   css: string 描述该设置需要加入的 CSS，无论是否打开设置均会生效
   *   acss: string 仅当该设置打开时加入这些 CSS
   *   init: Function 初始化时会回调一次
   *   ainit: Function 仅当该设置打开时，初始化时回调一次
   */
  class Rule extends RuleItem {
    constructor(item) {
      if (!(item.parent instanceof Group)) {
        throw TypeError('Rule must in some Group');
      }
      super(item);
      rules.all.set(this.id, this);
    }
    /** @type {number|number[]} */
    get weiboVersion() { return 6; } // 如果没有特殊说明，这条规则只支持旧版（v6）微博
    isWeiboVersionSupported() {
      const versions = Array.isArray(this.weiboVersion) ? this.weiboVersion : [this.weiboVersion];
      return versions.includes(yawf.WEIBO_VERSION);
    }
    render(...args) {
      const node = super.render(...args);
      node.classList.add('yawf-config-rule');
      if (!this.isWeiboVersionSupported()) {
        node.classList.add('yawf-config-rule-unsupport');
      }
      return node;
    }
    execute() {
      if (!this.isWeiboVersionSupported()) return;
      const enabled = this.isEnabled();
      try {
        const styles = [];
        if (typeof this.css === 'string') styles.push(this.css);
        if (typeof this.css === 'function') styles.push(this.css());
        if (enabled) {
          if (typeof this.acss === 'string') styles.push(this.acss);
          if (typeof this.acss === 'function') styles.push(this.acss());
        }
        if (styles.length) rule.style.append(styles.join('\n'));
        if (typeof this.init === 'function') this.init();
        if (enabled) {
          if (typeof this.ainit === 'function') this.ainit();
        }
      } catch (e) {
        util.debug('Error while execute rule %o: %o', this, e);
      }
    }
  }
  rule.class.Rule = Rule;
  rule.Rule = function (item) {
    const result = new Rule(item);
    if (rule.inited) result.execute();
    return result;
  };

  /**
   * 设置中的一个纯文本项，这个设置项没有复选框
   * 继承自有复选框的设置项，此时认为该复选框是总被选中的
   */
  class Text extends Rule {
    constructor(item) {
      super(item);
      this.always = true;
    }
    render(...args) {
      const node = super.render(...args);
      node.classList.add('yawf-config-text');
      return node;
    }
  }
  rule.Text = function (item) {
    return new Text(item);
  };
  rule.class.Text = Text;

  /**
   * 从所有设置项中根据条件筛选出一些设置项
   * 之后可用于展示对话框等操作
   * @param {{ base: Tab[], filter: (rule: Rule) => boolean }} base 描述搜索范围
   */
  rule.query = function ({
    base = tabs,
    filter = null,
    includeHidden = false,
  } = {}) {
    const result = new Set();
    ; (function query(items) {
      items.forEach(item => {
        if (item.hidden && !includeHidden) return;
        if (item.disabled) return;
        if (item instanceof Tab || item instanceof Group) {
          query(item.children);
        }
        if (!(item instanceof Rule)) return;
        if (filter && !filter(item)) return;
        result.add(item);
      });
    }(base));
    return [...result];
  };

  rule.inited = false;
  rule.init = function () {
    rule.style = css.add('');
    rule.inited = true;
    rule.query({ includeHidden: true }).forEach(rule => rule.execute());
  };

  init.onReady(() => {
    rule.init();
  }, { priority: priority.DEFAULT });

  css.append(`
.yawf-WBV6 .yawf-config-group { display: block; font-weight: bold; margin: 15px 10px 5px; }
.yawf-WBV6 .yawf-config-rule { display: block; margin: 5px 20px; }
.yawf-WBV6 .yawf-config-rule-unsupport { opacity: 0.5; }
.yawf-WBV6 .yawf-bubble .yawf-config-rule { display: inline; margin: 0; }
.yawf-WBV6 .yawf-config-rule > label + label { margin-left: 8px; }
.yawf-WBV6 .yawf-config-rule > br + label { margin-left: 20px; }
.yawf-WBV6 .yawf-bubble-icon { vertical-align: middle; margin-left: 2px; margin-right: 2px; }
.yawf-WBV6 .yawf-bubble-text .yawf-bubble-icon { display: none; }
.yawf-WBV6 .yawf-config-select { height: 20px; }
.yawf-WBV6 .yawf-config-number input[type="number"] { width: 45px; box-sizing: border-box; }
.yawf-WBV6 .yawf-config-range { position: relative; }
.yawf-WBV6 .yawf-config-range-wrap { display: none; position: absolute; left: 0; right: 0; margin: 0; bottom: calc(100% + 2px); height: 80px; background: #f0f0f0; background: Menu; }
.yawf-WBV6 .yawf-config-range:focus-within .yawf-config-range-wrap { display: block; }
.yawf-WBV6 .yawf-config-range input[type="range"] { position: absolute; top: 0; bottom: 0; margin: auto; width: 75px; right: -20px; left: -20px; transform: rotate(-90deg); }
.yawf-WBV6 .yawf-config-color input[type="color"] { width: 45px; box-sizing: border-box; height: 20px; vertical-align: middle; }
.yawf-WBV6 .yawf-config-text textarea { width: calc(100% - 20px); padding-left: 10px; padding-right: 10px; min-height: 120px; resize: vertical; }
.yawf-WBV6 .yawf-config-collection-input { margin: 5px; }
.yawf-WBV6 .yawf-config-collection-list { display: block; margin: 5px; }
.yawf-WBV6 .yawf-config-collection-list .yawf-config-collection-item { padding: 0 5px 0 20px; min-width: 0; height: 20px; overflow: hidden; text-overflow: ellipsis; cursor: default; }
.yawf-WBV6 .yawf-config-collection-remove { display: block; position: absolute; top: 0; left: 0; display: flow-root; width: 20px; height: 20px; line-height: 20px; }
.yawf-WBV6 .yawf-config-collection-item-content { max-width: 500px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-collection-list { margin-left: -5px; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-collection-item { width: 90px; height: 50px; padding: 1px 20px 1px 56px; text-align: left; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-collection-remove { right: 0; left: auto; text-align: center; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-collection-remove a { position: static; margin: 0; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-user-avatar { position: absolute; left: 1px; top: 1px; width: 50px; height: 50px; overflow: hidden; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-user-avatar-img { width: 50px; height: 50px; }
.yawf-WBV6 .yawf-config-collection-user-id .yawf-config-user-name { max-width: 100%; word-break: break-all; white-space: normal; max-height: 40px; overflow: hidden; }
.yawf-WBV6 .yawf-collection-suggestion.yawf-collection-suggestion { z-index: 10000; position: fixed; }
.yawf-WBV6 .yawf-list-suggestion-item a { min-height: 15.6px; }
`);

  css.append(`
.yawf-WBV7 label:hover .yawf-config-checkbox-wrap .yawf-config-checkbox-icon,
.yawf-WBV7 .yawf-config-checkbox-wrap:hover .yawf-config-checkbox-icon { border-color: var(--w-checkbox-check-color); }
.yawf-WBV7 .yawf-config-checkbox-wrap { display: inline-block; position: relative; width: var(--w-checkbox-size); height: var(--w-checkbox-size); overflow: hidden; margin-right: 4px; vertical-align: baseline; }
.yawf-WBV7 .yawf-config-checkbox { position: absolute; left: -100px; }
.yawf-WBV7 .yawf-config-checkbox-icon { border: 1px solid var(--w-checkbox-border); color: var(--w-checkbox-check-color); }
.yawf-WBV7 .yawf-config-checkbox-icon { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
.yawf-WBV7 .yawf-config-checkbox-icon svg { position: absolute; top: -1px; left: -1px; right: -1px; bottom: -1px; }
.yawf-WBV7 .yawf-config-checkbox:not(:checked) ~ .yawf-config-checkbox-icon svg { display: none; }

.yawf-WBV7 .yawf-config-group { display: block; font-weight: bold; margin: 15px 10px 5px; }
.yawf-WBV7 .yawf-config-rule { display: block; margin: 5px 20px; }
.yawf-WBV7 .yawf-config-rule-unsupport { opacity: 0.5; }
.yawf-WBV7 .yawf-bubble .yawf-config-rule { display: inline; margin: 0; }
.yawf-WBV7 .yawf-config-rule > label + label { margin-left: 8px; }
.yawf-WBV7 .yawf-config-rule > br + label { margin-left: 20px; }
.yawf-WBV7 .yawf-bubble-icon { vertical-align: middle; margin-left: 2px; margin-right: 2px; display: inline; }
.yawf-WBV7 .yawf-bubble-text .yawf-bubble-icon { display: none; }
.yawf-WBV7 .yawf-config-select { height: 20px; }
.yawf-WBV7 .yawf-config-number input[type="number"] { width: 45px; box-sizing: border-box; }
.yawf-WBV7 .yawf-config-range { position: relative; }
.yawf-WBV7 .yawf-config-range-wrap { display: none; position: absolute; left: 0; right: 0; margin: 0; bottom: calc(100% + 2px); height: 80px; background: #f0f0f0; background: Menu; }
.yawf-WBV7 .yawf-config-range:focus-within .yawf-config-range-wrap { display: block; }
.yawf-WBV7 .yawf-config-range input[type="range"] { position: absolute; top: 0; bottom: 0; margin: auto; width: 75px; right: -20px; left: -20px; transform: rotate(-90deg); }
.yawf-WBV7 .yawf-config-color input[type="color"] { width: 45px; box-sizing: border-box; height: 20px; vertical-align: middle; }
.yawf-WBV7 .yawf-config-text textarea { width: 100%; min-height: 120px; resize: vertical; padding-left: var(--w-input-indent); padding-right: var(--w-input-indent); }
.yawf-WBV7 .yawf-config-collection-submit,
.yawf-WBV7 .yawf-config-key button { padding: 4px 16px; margin: 0 4px; vertical-align: bottom; }
.yawf-WBV7 .yawf-config-collection-list { display: block; margin: 5px; padding: 0; }
.yawf-WBV7 .yawf-config-collection-list .yawf-config-collection-item { padding: 0 5px 0 20px; min-width: 0; height: 20px; overflow: hidden; text-overflow: ellipsis; cursor: default; display: inline-block; position: relative; margin-left: 8px; border: 1px solid var(--w-b-line-primary-border); }
.yawf-WBV7 .yawf-config-collection-remove { display: block; position: absolute; top: 2px; left: 0; display: flow-root; width: 20px; height: 20px; line-height: 20px; text-align: center; cursor: pointer; }
.yawf-WBV7 .yawf-config-collection-item-content { max-width: 500px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-collection-list { margin-left: -5px; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-collection-item { width: 90px; height: 50px; padding: 1px 20px 1px 56px; text-align: left; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-collection-remove { right: 0; left: auto; text-align: center; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-collection-remove a { position: static; margin: 0; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-user-avatar { position: absolute; left: 1px; top: 1px; width: 50px; height: 50px; overflow: hidden; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-user-avatar-img { width: 50px; height: 50px; }
.yawf-WBV7 .yawf-config-collection-user-id .yawf-config-user-name { max-width: 100%; word-break: break-all; white-space: normal; max-height: 40px; overflow: hidden; }
.yawf-WBV7 .yawf-collection-suggestion.yawf-collection-suggestion { z-index: 10000; position: fixed; background: var(--w-card-background); border: 1px solid var(--w-layer-border); border-radius: var(--w-layer-radius); }
.yawf-WBV7 .yawf-collection-suggestion-list { margin: 0; padding: 10px 0; list-style: none; }
.yawf-WBV7 .yawf-list-suggestion-item { line-height: 20px; padding: 5px 10px; }
.yawf-WBV7 .yawf-list-suggestion-item.yawf-current { line-height: 20px; padding: 5px 10px; background: var(--w-pop-item-hover); }
.yawf-WBV7 .yawf-list-suggestion-item a { min-height: 15.6px; color: inherit; text-decoration: none; }
.yawf-WBV7 .yawf-config-item .woo-input-wrap { height: 20px; line-height: 20px; --w-input-height: 20px; box-sizing: content-box; margin-left: 4px; margin-right: 4px; }
.yawf-WBV7 .yawf-config-item .woo-input-wrap.woo-input-text { height: auto; width: 100%; box-sizing: border-box; }
.yawf-WBV7 .yawf-config-item .woo-input-wrap input,
.yawf-WBV7 .yawf-config-item .woo-input-wrap select { vertical-align: bottom; }
.yawf-WBV7 .yawf-config-item .yawf-config-select .woo-input-wrap { padding-right: 36px; position: relative; }
.yawf-WBV7 .yawf-config-item .yawf-config-select .woo-input-wrap::before { content: " "; display: block; width: 0; height: 0; border-top: 4px solid currentColor; border-left: 4px solid transparent; border-right: 4px solid transparent; position: absolute; right: 14px; top: calc(50% - 2px); }
.yawf-WBV7 .yawf-config-text .woo-input-wrap { width: 520px; height: auto; padding: 0; }
`);

}());
