"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_index = require("./store/index.js");
if (!Math) {
  "./pages/home/index.js";
  "./pages/student/index.js";
  "./pages/analysis/index.js";
  "./pages/setting/index.js";
}
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "App",
  setup(__props) {
    common_vendor.onLaunch(() => {
      common_vendor.index.__f__("log", "at App.vue:6", "App Launch");
    });
    common_vendor.onShow(() => {
      common_vendor.index.__f__("log", "at App.vue:10", "App Show");
      autoSyncFromWebDAV();
    });
    common_vendor.onHide(() => {
      common_vendor.index.__f__("log", "at App.vue:16", "App Hide");
      autoSyncToWebDAV();
    });
    const autoSyncToWebDAV = async () => {
      const store = store_index.useAppStore();
      await store.syncToWebDAV();
    };
    const autoSyncFromWebDAV = async () => {
      const store = store_index.useAppStore();
      const success = await store.syncFromWebDAV();
      if (success) {
        common_vendor.index.__f__("log", "at App.vue:32", "从云端同步数据成功");
      }
    };
    return () => {
    };
  }
});
function createApp() {
  const app = common_vendor.createSSRApp(_sfc_main);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app,
    pinia
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
