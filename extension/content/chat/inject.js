; (function () {

  const yawf = window.yawf;

  const message = yawf.message;
  const util = yawf.util;
  const chatframe = yawf.chatframe;

  const strings = util.strings;

  if (window.top === window) return;

  const key = 'yawf_chat_message_' + strings.randKey();

  util.inject(function (key) {
    if (document.readyState === 'complete') {
      location.reload();
      return;
    }

    ; (function (window, document, Object, Promise) {

      let vueReadyResolve = null;
      const vueReady = new Promise(resolve => {
        vueReadyResolve = resolve;
      });

      Object.defineProperty(Object.prototype, '$store', {
        set: function (value) {
          const proto = Object.getPrototypeOf(this);
          Object.setPrototypeOf(this, null);
          this.$store = value;
          Object.setPrototypeOf(this, proto);
          vueReadyResolve(this);
        },
        configurable: true,
        enumerable: false,
      });

      let onload = new Promise(resolve => {
        window.addEventListener('load', () => { resolve(); });
      });

      let everythingReady = onload.then(() => vueReady);

      const getVueInstance = function (tester) {
        return function find(vue) {
          if (tester(vue)) return vue;
          return (vue.$children || []).reduce((found, child) => {
            if (found) return found;
            return find(child);
          }, null);
        };
      };

      const chatUid = function (uid) {
        everythingReady.then(root => {
          const vue = getVueInstance(vue => vue.getpernewuser)(root);
          const $store = vue.$store;
          const chatlist = $store.state.chatlist;
          const chatlistIndex = chatlist.findIndex(item => Number(item.id) == uid);
          if (chatlistIndex !== -1) {
            chatlist.unshift(...chatlist.splice(chatlistIndex, 1));
            $store.commit('selectSession', uid);
            return;
          }
          const topuser = $store.state.topuser;
          const toplistIndex = topuser.findIndex(item => Number(item.id) === uid);
          if (toplistIndex !== -1) {
            $store.commit('selectSession', uid);
          } else {
            vue.getpernewuser(uid, item => {
              if (!item) return;
              item.is_top_user = false;
              $store.commit('unshiftchatlist', item);
              $store.commit('selectSession', uid);
            });
          }
        });
      };

      Object.defineProperty(window, key, {
        set: function (message) {
          if (message.method === 'chatUid') {
            chatUid(message.uid);
          }
        },
        configurable: false,
        enumerable: false,
      });

    }(window, document, Object, Promise));

  }, key);

  message.export(function chatToUid(uid) {
    util.inject(function (key, uid) {
      window[key] = { method: 'chatUid', uid };
    }, key, Number(uid));
  });

  chatframe.chatReady();

}());
