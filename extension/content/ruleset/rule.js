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

  const BaseConfigItem = function CommonConfigItem(item) {
    Object.assign(this, item);
    if (!this.ref) this.ref = {};
    Object.keys(this.ref).forEach(key => {
      if (this.ref[key] instanceof CommonConfigItem) return;
      this.ref[key] = configItemBuilder(this.ref[key], this);
    });
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
        String.raw`([^\|\[\{\&]+)`, // text
      ].map(reg => `(?:${reg})`).join('|'), 'g');
      /** @type {string?[][]} */
      const matches = [];
      while (true) {
        const match = parseReg.exec(template);
        if (!match) break;
        matches.push([...match]);
      }
      const tokens = matches.map(([_, ...typed]) => {
        const types = ['child', 'rule', 'spliter', 'text'];
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
    tokenRender.spliter = function (token, reference, ref) {
      const next = reference.parentNode.insertBefore(document.createElement('label'), reference.nextSibling);
      if (token === '||') reference.parentNode.insertBefore(document.createElement('br'), reference);
      return next;
    };
    /** @type {TemplateTokenRender} */
    tokenRender.text = function (token, reference, ref) {
      reference.appendChild(document.createTextNode(token.value));
      return reference;
    };
    /** @type {Array<string>} */
    let acceptTypes = [];
    const itemRender = function (template, ref, mode = null) {
      const types = mode && (acceptTypes = {
        normal: ['child', 'spliter', 'text'],
        recursive: ['child', 'spliter', 'text', 'rule'],
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
    if (this.renderResult) return this.renderResult;
    let node = this.render();
    if (typeof this.rendered === 'function') {
      node = this.rendered(node);
    }
    this.renderResult = node;
    return this.renderResult;
  };

  class ConfigItem extends BaseConfigItem {
    constructor(item, context) {
      super(item);
      if (context) {
        this.context = context;
        this.id = context.id + '.' + item.id;
      }
    }
    initial() { return this.normalize(null); }
    normalize(value) { return value; }
    initConfig() {
      if (this.config) return;
      if (!this.id) throw Error('id is required to init config');
      this.config = config.user.key(this.id);
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
  }
  rule.class.ConfigItem = ConfigItem;

  class BooleanConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    normalize(value) {
      return !!value;
    }
    isEnabled() {
      return this.always || this.getConfig();
    }
    render() {
      const node = super.render();
      if (this.always) return node;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.classList.add('W_checkbox');
      checkbox.checked = this.isEnabled();
      checkbox.addEventListener('change', event => {
        if (!event.isTrusted) checkbox.checked = this.getConfig();
        else this.setConfig(checkbox.checked);
      });
      this.addConfigListener(newValue => {
        checkbox.checked = newValue;
      });
      const label = node.querySelector('label');
      label.insertBefore(checkbox, label.firstChild);
      return node;
    }
  }
  rule.class.BooleanConfigItem = BooleanConfigItem;

  const configItemBuilder = function (item, parent) {
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

}());

