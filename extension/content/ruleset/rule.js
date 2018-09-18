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
 *   TODO
 *
 * ConfigItem 的属性和方法包括：
 * 显示相关
 *   template() （可选） 用于显示的模板
 *   render(isRoot: boolean) （可选） 显示的函数，如果缺省则使用 template 属性根据规则生成
 *   rendered() （可选） 在调用 render 后可用这个函数对产生的 DOM 做进一步修改
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
; (async function () {

  const yawf = window.yawf;

  const util = yawf.util;
  const storage = yawf.storage;
  const config = yawf.config;
  const init = yawf.init;

  const css = util.css;
  const ui = util.ui;
  const i18n = util.i18n;
  const priority = util.priority;

  const rule = yawf.rule = {};
  const rules = yawf.rules = {};
  const tabs = rule.tabs = [];

  rule.class = {};

  const BaseConfigItem = function CommonConfigItem(self) {
    if (!self.ref) self.ref = {};
    Object.keys(self.ref).forEach(key => {
      if (self.ref[key] instanceof CommonConfigItem) return;
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
  BaseConfigItem.prototype.template = function () { return ''; };

  /** @param {boolean} fullDom */
  const parseTemplate = function (fullDom) {
    const item = this;
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
    tokenRender.child = function (token, reference, ref) {
      if (fullDom) {
        reference.appendChild(ref[token.value].render(false));
      } else {
        reference.appendChild(ref[token.value].text(false));
      }
      return reference;
    };
    /** @type {TemplateTokenRender} */
    tokenRender.rule = function (token, reference, ref) {
      reference.appendChild(ruleRender(rule.all.get(token.value)));
      return reference;
    };
    /** @type {TemplateTokenRender} */
    tokenRender.splitter = function (token, reference, ref) {
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
    tokenRender.text = function (token, reference, ref) {
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
        tokenRender[token.type](token, reference, ref)
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

  BaseConfigItem.prototype.render = parseTemplate(true);
  BaseConfigItem.prototype.text = ((parse => function (isRoot = true) {
    let result;
    if (this.template) result = parse.apply(this);
    else result = this.render();
    return result && result.textContent.trim() || '';
  })(parseTemplate(false)));
  BaseConfigItem.prototype.getRenderResult = function () {
    let node = this.render();
    if (typeof this.rendered === 'function') {
      node = this.rendered(node);
    }
    return node;
  };

  const nextConfigId = (function () {
    let lastIndex = Math.floor(Math.random() * 1e7) * 10;
    return function () {
      lastIndex += Math.floor(Math.random() * 100);
      const rand = Math.random().toString(36).slice(2);
      const index = lastIndex.toString(36);
      return `yawf-${rand}-${lastIndex}`;
    };
  }());

  class ConfigItem extends BaseConfigItem {
    constructor(item, context) {
      super(item);
      if (context) {
        this.context = context;
        if (this.id) this.id = context.id + '.' + this.id;
      }
      this.configId = nextConfigId();
      this.configInitialized = false;
    }
    get initial() { return null; }
    normalize(value) { return value; }
    initConfig() {
      if (this.configInitialized) return;
      if (!this.config) {
        if (!this.id) throw Error('id is required to init config');
        this.config = config.user.key(this.id);
      }
      this.configInitialized = true;
      console.log('listen %o for %o', this.id, this.configId);
      this.config.addListener(newValue => {
        const items = this.getRenderedItems();
        console.log('callback listen %o for %o: update %o', this.id, this.configId, items);
        items.forEach(item => this.renderValue(item));
      });
    }
    getConfig() {
      this.initConfig();
      const value = this.config.get();
      const normalize = this.normalize(value);
      if (value && JSON.stringify(value) !== normalize && JSON.stringify(normalize)) {
        this.config.set(normalize);
      }
      return normalize;
    }
    setConfig(value) {
      this.initConfig();
      const normalize = this.normalize(value);
      this.config.set(normalize);
      return normalize;
    }
    addConfigListener(callback) {
      this.initConfig();
      this.config.addListener(callback);
    }
    removeConfigListener(callback) {
      this.initConfig();
      this.config.addListener(callback);
    }
    render(...args) {
      const node = super.render(...args);
      node.setAttribute('yawf-config-item', this.configId);
      return node;
    }
    getRenderedItems() {
      console.log('get attribute of %o: %o', this, this.configId);
      const selector = `[yawf-config-item="${this.configId}"]`;
      return Array.from(document.querySelectorAll(selector));
    }
    /** @param {HTMLElement} container */
    renderValue(container) {
      return container;
    }
  }
  rule.class.ConfigItem = ConfigItem;

  class BooleanConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return false; }
    normalize(value) { return !!value; }
    isEnabled() {
      return this.always || this.getConfig();
    }
    render(...args) {
      const container = super.render(...args);
      if (this.always) return container;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('W_checkbox');
      checkbox.setAttribute('yawf-config-input', this.configId);
      checkbox.addEventListener('change', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else this.setConfig(checkbox.checked);
      });
      const label = container.querySelector('label');
      label.insertBefore(checkbox, label.firstChild);
      checkbox.checked = this.getConfig();
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

  class SelectConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
      const select = this.select;
      if (!select || !Array.isArray(select)) {
        throw TypeError('`select` attribute is required for select config item');
      }
      if (select.some(item => item.value !== '' + item.value)) {
        throw TypeError("Select options' value should be string");
      }
    }
    get initial() {
      if (!this.select) return null;
      if (!this.select[0]) return null;
      return this.select[0].value;
    }
    normalize(value) {
      if (!this.select || !Array.isArray(this.select)) return null;
      if (this.select.find(item => item.value === value)) return value;
      return this.initial;
    }
    render() {
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-select');
      if (!Array.isArray(this.select) || !this.select) {
        return container;
      }
      const select = document.createElement('select');
      this.select.forEach(({ text, value }) => {
        const option = document.createElement('option');
        option.value = value;
        option.text = typeof text === 'function' ? text() : text;
        select.add(option);
      });
      select.setAttribute('yawf-config-input', this.configId);
      select.value = this.getConfig();
      select.addEventListener('change', event => {
        if (!event.isTrusted) {
          this.renderValue(container);
        } else this.setConfig(select.value);
      });
      container.appendChild(select);
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `select[yawf-config-input="${this.configId}"]`;
      const select = container.querySelector(selector);
      const config = this.getConfig();
      if (select && select.value !== config) {
        select.value = config;
      }
      return container;
    }
  }
  rule.class.SelectConfigItem = SelectConfigItem;

  class NumberConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    get initial() { return this.min; }
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
      const container = document.createElement('span');
      container.setAttribute('yawf-config-item', this.configId);
      container.classList.add('yawf-config-number');
      const input = document.createElement('input');
      input.type = 'number';
      input.value = this.getConfig();
      if (+this.min === this.min && this.min !== -Infinity) input.min = this.min;
      if (+this.max === this.max && this.max !== Infinity) input.max = this.max;
      if (+this.step === this.step && Number.isFinite(this.step)) input.step = this.step;
      input.addEventListener('input', event => {
        if (!event.isTrusted) input.value = this.getConfig();
        else this.setConfig(+input.value);
      });
      input.addEventListener('blur', event => {
        input.value = this.getConfig();
      });
      input.setAttribute('yawf-config-input', this.configId);
      container.appendChild(input);
      return container;
    }
    renderValue(container) {
      container = super.renderValue(container);
      const selector = `input[type="number"][yawf-config-input="${this.configId}"]`;
      const number = container.querySelector(selector);
      const config = this.getConfig();
      if (number && +number.value !== this.config) {
        number.value = config;
      }
      return container;
    }
  }
  rule.class.NumberConfigItem = NumberConfigItem;

  class RangeConfigItem extends NumberConfigItem {
    render() {
      const container = super.render();
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
        if (!event.isTrusted) range.value = this.getConfig();
        else this.setConfig(+range.value);
      });
      range.addEventListener('blur', event => {
        this.renderValue();
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
      if (range && +range.value !== this.config) {
        range.value = config;
      }
      return container;
    }
  }
  rule.class.RangeConfigItem = RangeConfigItem;

  class BubbleConfigItem extends BaseConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    render(...args) {
      const content = super.render(...args);
      const container = document.createElement('span');
      const iconType = this.icon || 'ask';
      const icon = document.createElement('i');
      icon.classList.add('W_icon', 'yawf-bubble-icon', `icon_${iconType}S`);
      container.appendChild(icon);
      ui.bubble(content, icon);
      return container;
    }
  }
  rule.class.BubbleConfigItem = BubbleConfigItem;

  const configItemBuilder = function (item, parent) {
    if (item && item.type === 'boolean') return new BooleanConfigItem(item, parent);
    if (item && item.type === 'select') return new SelectConfigItem(item, parent);
    if (item && item.type === 'number') return new NumberConfigItem(item, parent);
    if (item && item.type === 'range') return new RangeConfigItem(item, parent);
    if (item && item.type === 'bubble') return new BubbleConfigItem(item, parent);
    return new ConfigItem(item, parent);
  };

  class RuleItem extends BooleanConfigItem {
    get type() { return 'normal'; }
    constructor(item) {
      super(item, null);
      if (this.parent) {
        this.parent.children.push(this);
      }
    }
  }

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
  const tabBuilder = rule.Tab = function (item) {
    return new Tab(item);
  };
  rule.class.Tab = Tab;

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
    render() {
      const node = super.render();
      node.classList.add('yawf-config-group');
      return node;
    }
  }
  const groupBuilder = rule.Group = function (item) {
    return new Group(item);
  };
  rule.class.Group = Group;

  class Rule extends RuleItem {
    constructor(item) {
      if (!(item.parent instanceof Group)) {
        throw TypeError('Rule must in some Group');
      }
      super(item);
    }
    render() {
      const node = super.render();
      node.classList.add('yawf-config-rule');
      return node;
    }
    execute() {
      const enabled = this.isEnabled();
      try {
        const styles = [];
        if (typeof this.css === 'string') styles.push(this.css);
        if (typeof this.css === 'function') styles.push(this.css());
        if (enabled) {
          if (typeof this.acss === 'string') styles.push(this.acss);
          if (typeof this.acss === 'function') styles.push(this.acss());
        }
        rule.style.append(styles.join('\n'));
        if (typeof this.init === 'function') this.init();
        if (enabled) {
          if (typeof this.ainit === 'function') this.ainit();
        }
      } catch (e) {
        util.debug('Error while execute rule %o: %o', this, e);
      }
    }
  }
  const ruleBuilder = rule.Rule = function (item) {
    return new Rule(item);
  };
  rule.class.Rule = Rule;

  class Text extends Rule {
    constructor(item) {
      super(item);
      this.always = true;
    }
    render() {
      const node = super.render();
      node.classList.add('yawf-config-text');
      return node;
    }
  }
  const textBuilder = rule.Text = function (item) {
    return new Text(item);
  };
  rule.class.Text = Text;

  /** @type { ({ base: [] }) => [] } */
  const query = rule.query = function ({ base = tabs } = {}) {
    const result = new Set();
    ; (function query(items) {
      items.forEach(item => {
        if (item instanceof Tab || item instanceof Group) {
          query(item.children);
        }
        if (!(item instanceof Rule)) return;
        result.add(item);
      });
    }(base));
    return [...result];
  };

  rule.init = function () {
    rule.style = css.add('');
    rule.query().forEach(rule => rule.execute());
  };

  init.onReady(async () => {
    rule.init();
  }, { priority: priority.DEFAULT, async: true });

  css.add(`
.yawf-config-rule > label + label { margin-left: 8px; }
.yawf-config-rule > br + label { margin-left: 20px; }
.yawf-bubble-icon { vertical-align: middle; margin-left: 2px; margin-right: 2px; }
.yawf-config-number input[type="number"] { width: 45px; box-sizing: border-box; }
.yawf-config-range { position: relative; }
.yawf-config-range-wrap { display: none; position: absolute; left: 0; right: 0; margin: 0; bottom: calc(100% + 2px); height: 80px; background: #f0f0f0; background: Menu; }
.yawf-config-range:focus-within .yawf-config-range-wrap { display: block; }
.yawf-config-range input[type="range"] { position: absolute; top: 0; bottom: 0; margin: auto; width: 75px; right: -20px; left: -20px; transform: rotate(-90deg); }
`);

}());

