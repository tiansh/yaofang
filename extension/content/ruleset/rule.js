; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;

  const css = util.css;
  const ui = util.ui;
  const i18n = util.i18n;
  const config = util.config;

  const rule = yawf.rule = {};
  const rules = yawf.rules = {};
  const tabs = rule.tabs = [];

  const CommonConfigItem = function CommonConfigItem(item) {
    Object.assign(this, item);
    if (!this.ref) this.ref = {};
    Object.keys(this.ref).forEach(key => {
      if (this.ref[key] instanceof CommonConfigItem) return;
      this.ref[key] = ConfigItemBuilder(this.ref[key], this);
    });
  };
  CommonConfigItem.prototype.template = function () { return ''; };

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
      reference.appendChild(ref[token.value].render(false));
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
      const template = this.template();
      const ref = this.ref;
      const mode = fullDom ? isRoot ? 'recursive' : 'normal' : 'text';
      return itemRender(template, ref, mode);
    };

    return ruleRender;
  };

  CommonConfigItem.prototype.render = parseTemplate(true);
  CommonConfigItem.prototype.text = parseTemplate(false);

  class ConfigItem extends CommonConfigItem {
    constructor(item, context) {
      super(item);
      if (context) {
        this.context = context;
        this.id = context.id + '.' + item.id;
      }
    }
    initial() { return this.normalize(null); }
    normalize(value) { return value; }
    get conf() {
      const id = this.id;
      const value = config.get(id);
      if (value != null) {
        return this.normalize(value);
      }
      if (typeof this.initial === 'function') {
        return this.initial();
      }
      return this.initial;
    }
    set conf(value) {
      const id = this.id;
      const normalized = this.normalize(value);
      config.set(id);
      return true;
    }
  }

  class BooleanConfigItem extends ConfigItem {
    constructor(item, parent) {
      super(item, parent);
    }
    normalize(value) {
      return !!value;
    }
    render() {
      const node = super.render();
      if (this.always) return node;
      return node;
    }
  }

  const ConfigItemBuilder = function (item, parent) {
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
    render() {
      const span = document.createElement('span');
      span.textContent = this.template();
      return span;
    }
  }
  const tabBuilder = rule.Tab = function (item) {
    return new Tab(item);
  };

  class Group extends RuleItem {
    get type() { return 'group'; }
    constructor(item) {
      if (!(item.parent instanceof Tab)) {
        throw TypeError('Group must in some Tab');
      }
      super(item);
      this.children = [];
    }
    render(isRoot = true) {
      const node = super.render(isRoot);
      node.classList.add('yawf-config-group');
      return node;
    }
  }
  const groupBuilder = rule.Group = function (item) {
    return new Group(item);
  };

  class Rule extends RuleItem {
    constructor(item) {
      if (!(item.parent instanceof Group)) {
        throw TypeError('Rule must in some Group');
      }
      super(item);
    }
    render(isRoot = true) {
      const node = super.render(isRoot);
      node.classList.add('yawf-config-rule');
      return node;
    }
  }
  const ruleBuilder = rule.Rule = function (item) {
    return new Rule(item);
  };

  class Text extends Rule {
    constructor(item) {
      super(item);
      this.always = true;
    }
    render(isRoot = true) {
      const node = super.render(isRoot);
      node.classList.add('yawf-config-text');
      return node;
    }
  }
  const textBuilder = rule.Text = function (item) {
    return new Text(item);
  };

  /** @type { ({ base: [] }) => [] } */
  const query = rule.query = function ({ base }) {
    const context = base || tabs;
    const result = new Set();
    ; (function query(items) {
      items.forEach(item => {
        if (item instanceof Tab || item instanceof Group) {
          query(item.children);
        }
        if (!(item instanceof Rule)) return;
        result.add(item);
      });
    }(context));
    return [...result];
  };

  css.add(`
.yawf-config-group { display: block; font-weight: bold; margin: 15px 10px 5px; }
.yawf-config-rule { display: block; margin: 5px 20px; }
`);

}());

