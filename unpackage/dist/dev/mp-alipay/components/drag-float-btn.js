"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "drag-float-btn",
  props: {
    edgePadding: { default: 20 }
  },
  emits: ["click"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const position = common_vendor.ref({ x: 0, y: 0 });
    const isDragging = common_vendor.ref(false);
    const dragStartPos = common_vendor.ref({ x: 0, y: 0 });
    const hasMoved = common_vendor.ref(false);
    const windowWidth = common_vendor.ref(375);
    const windowHeight = common_vendor.ref(667);
    const btnSize = common_vendor.ref(50);
    const safeAreaBottom = common_vendor.ref(0);
    const btnStyle = common_vendor.computed(() => ({
      left: position.value.x + "px",
      top: position.value.y + "px"
    }));
    const onClick = () => {
      if (!hasMoved.value) {
        emit("click");
      }
    };
    const onTouchStart = (e) => {
      const touch = e.touches[0];
      dragStartPos.value = {
        x: touch.clientX - position.value.x,
        y: touch.clientY - position.value.y
      };
      isDragging.value = true;
      hasMoved.value = false;
    };
    const onTouchMove = (e) => {
      if (!isDragging.value)
        return;
      e.preventDefault();
      const touch = e.touches[0];
      let newX = touch.clientX - dragStartPos.value.x;
      let newY = touch.clientY - dragStartPos.value.y;
      const minX = props.edgePadding;
      const maxX = windowWidth.value - btnSize.value - props.edgePadding;
      const minY = props.edgePadding;
      const maxY = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value;
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      const dx = Math.abs(newX - position.value.x);
      const dy = Math.abs(newY - position.value.y);
      if (dx > 5 || dy > 5) {
        hasMoved.value = true;
      }
      position.value.x = newX;
      position.value.y = newY;
    };
    const onTouchEnd = () => {
      if (isDragging.value) {
        isDragging.value = false;
        savePosition();
      }
    };
    const savePosition = () => {
      try {
        common_vendor.index.setStorageSync("float_btn_position", {
          x: position.value.x,
          y: position.value.y
        });
      } catch (e) {
        common_vendor.index.__f__("log", "at components/drag-float-btn.vue:112", "保存位置失败", e);
      }
    };
    const loadPosition = () => {
      try {
        const saved = common_vendor.index.getStorageSync("float_btn_position");
        if (saved) {
          const maxX = windowWidth.value - btnSize.value - props.edgePadding;
          const maxY = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value;
          if (saved.x >= props.edgePadding && saved.x <= maxX && saved.y >= props.edgePadding && saved.y <= maxY) {
            position.value.x = saved.x;
            position.value.y = saved.y;
            return;
          }
        }
      } catch (e) {
        common_vendor.index.__f__("log", "at components/drag-float-btn.vue:132", "加载位置失败", e);
      }
      position.value.x = windowWidth.value - btnSize.value - props.edgePadding;
      position.value.y = windowHeight.value - btnSize.value - props.edgePadding - safeAreaBottom.value;
    };
    common_vendor.onMounted(() => {
      var _a;
      const systemInfo = common_vendor.index.getSystemInfoSync();
      windowWidth.value = systemInfo.windowWidth;
      windowHeight.value = systemInfo.windowHeight;
      safeAreaBottom.value = ((_a = systemInfo.safeAreaInsets) == null ? void 0 : _a.bottom) || 0;
      btnSize.value = 100 * (windowWidth.value / 750);
      loadPosition();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.s(btnStyle.value),
        b: common_vendor.o(onTouchStart, "46"),
        c: common_vendor.o(onTouchMove, "f7"),
        d: common_vendor.o(onTouchEnd, "20"),
        e: common_vendor.o(onClick, "6c")
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c56e2f7e"]]);
my.createComponent(Component);
//# sourceMappingURL=../../.sourcemap/mp-alipay/components/drag-float-btn.js.map
