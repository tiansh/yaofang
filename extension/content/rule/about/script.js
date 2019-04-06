; (async function () {

  const yawf = window.yawf;
  const util = yawf.util;
  const rule = yawf.rule;

  const about = yawf.rules.about;

  const i18n = util.i18n;
  i18n.aboutScriptGroupTitle = {
    cn: '关于',
    hk: '關於',
    tw: '關於',
    en: 'About',
  };

  const script = about.script = {};
  script.script = rule.Group({
    parent: about.about,
    template: () => i18n.aboutScriptGroupTitle,
  });

  Object.assign(i18n, {
    aboutText: {
      cn: '{{logo}}药方 (Yet Another Weibo Filter) {{version}}{{br}}作者{{author}}，您可以关注 {{scriptWeibo}} 了解扩展的最新变化。{{br}}如果您在使用过程中遇到任何扩展的错误，或对脚本有任何建议，欢迎到 {{issuePage}} 反馈，或私信 {{scriptWeibo}}。{{br}}扩展使用 MPL-2.0 协议开放源代码，您可以在 {{github}} 上查阅。欢迎贡献代码。',
      tw: '{{logo}}藥方 (Yet Another Weibo Filter) {{version}}{{br}}作者{{author}}，您可以關注 {{scriptWeibo}} 了解擴充套件的最新變化。{{br}}如果您在使用過程中遇到任何擴充套件的錯誤，或對其有任何建議，歡迎到 {{issuePage}} 回饋，或聯繫 {{scriptWeibo}}。{{br}}擴充套件以 MPL-2.0 協定開放原始碼，您可以在 {{github}} 上查阅。欢迎贡献代码。',
      en: '{{logo}}Yet Another Weibo Filter (YAWF) {{version}}{{br}}Created by {{author}}. You may follow {{scriptWeibo}} for last updates info.{{br}}You may report errors and give suggestions on {{issuePage}}, or send private message to {{scriptWeibo}}.{{br}}This extension is released under MPL-2.0 license. You may get its source from {{github}}. Contributions are welcomed.',
    },
    aboutIssueTracker: {
      cn: '问题跟踪器',
      tw: '問題追踪器',
      en: 'issue tracker',
    },
    aboutGithubRepo: {
      cn: 'GitHub 仓库',
      tw: 'GitHub 存放庫',
      en: 'GitHub repository',
    },
  });

  script.text = rule.Text({
    parent: script.script,
    template: () => i18n.aboutText,
    ref: {
      br: {
        render() {
          return document.createElement('br');
        },
      },
      version: {
        render() {
          const version = browser.runtime.getManifest().version;
          return document.createTextNode(version);
        },
      },
      author: {
        render() {
          const link = document.createElement('a');
          link.href = 'https://weibo.com/tsh90';
          link.title = 'tsh90';
          link.textContent = '@tsh90';
          link.setAttribute('usercard', 'id=3921589057');
          return link;
        },
      },
      scriptWeibo: {
        render() {
          const link = document.createElement('a');
          link.href = 'https://weibo.com/yawfscript';
          link.title = 'YAWF脚本';
          link.textContent = '@YAWF脚本';
          link.setAttribute('usercard', 'id=5601033111');
          return link;
        },
      },
      logo: {
        render() {
          const container = document.createElement('span');
          container.style.cssFloat = 'right';
          const image = new Image(64, 64);
          image.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgOTYgOTYiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiI+CiAgPHBhdGggZmlsbD0iI0Q5MkQzQSIgZD0iTTEyLDU0YzExLjY4Ny0wLjU3NiwyMS4xOTctMC4xNDMsMjQuNzUsNy41YzMuMzk4LDUuNzAxLDAuMTkxLDEzLjA3NS0xLjUsMThjMy45MzYsMC43MDUsNi4xNjQsMi4wMTIsOC4yNSw0LjVjLTEwLjQ5OSwwLTIxLjAwMSwwLTMxLjUsMEMxMiw3NC4wMDEsMTIsNjMuOTk5LDEyLDU0eiIvPgogIDxwYXRoIGZpbGw9IiNFOThENDkiIGQ9Ik03MS4zNjYsMjguOTExYy0xMS4yMDQtMTMuMjYtMjcuNzMtMTguMzE1LTQyLjk4NC0xNC44NTNoLTAuMDA2Yy0zLjUzLDAuODA3LTUuNzgsNC41MTMtNS4wMjQsOC4yNzRjMC43NTIsMy43NjQsNC4yMjQsNi4xNjksNy43NTMsNS4zNjZjMTAuODUyLTIuNDYsMjIuNTk1LDEuMTM4LDMwLjU2LDEwLjU1OGM3Ljk1Nyw5LjQxOSwxMC4xMTksMjIuMjY2LDYuNzExLDMzLjUyOGwwLjAwMiwwLjAwMmMtMS4xMTEsMy42NjksMC43NjksNy41OTMsNC4yMSw4Ljc3OWMzLjQyNywxLjE4NSw3LjExMS0wLjgxOSw4LjIyMy00LjQ3OWMwLTAuMDA3LDAtMC4wMjEsMC4wMDItMC4wMjdDODUuNTk1LDYwLjIxNyw4Mi41NzQsNDIuMTU4LDcxLjM2NiwyOC45MTFNNTQuMTYxLDQ1LjQ4NmMtNS40NTMtNi40NTgtMTMuNTA1LTguOTExLTIwLjkzOC03LjIyNGMtMy4wMzgsMC42OTEtNC45NzQsMy44ODMtNC4zMjIsNy4xMjhjMC42NSwzLjIzMiwzLjYzNyw1LjMwOSw2LjY2OCw0LjYwNXYwLjAwN2MzLjYzMy0wLjgyLDcuNTczLDAuMzc2LDEwLjIzOSwzLjUyN2MyLjY2OSwzLjE1OCwzLjM4Niw3LjQ2LDIuMjQxLDExLjIzNWgwLjAwNmMtMC45NTIsMy4xNTEsMC42NjQsNi41MzksMy42MTgsNy41NmMyLjk1NSwxLjAxLDYuMTI1LTAuNzEsNy4wNzktMy44NjlDNjEuMDg2LDYwLjczOSw1OS42MjUsNTEuOTQzLDU0LjE2MSw0NS40ODYiLz4KPC9zdmc+Cg==';
          container.appendChild(image);
          return container;
        },
      },
      issuePage: {
        render() {
          const url = 'https://github.com/tiansh/yaofang/issues';
          const link = document.createElement('a');
          link.href = url;
          link.textContent = i18n.aboutIssueTracker;
          link.target = '_blank';
          return link;
        },
      },
      github: {
        render() {
          const url = 'https://github.com/tiansh/yaofang';
          const link = document.createElement('a');
          link.href = url;
          link.textContent = i18n.aboutGithubRepo;
          link.target = '_blank';
          return link;
        },
      },
    },
  });

}());
