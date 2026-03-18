"use strict";
const common_vendor = require("../../common/vendor.js");
const common_assets = require("../../common/assets.js");
const store_index = require("../../store/index.js");
const utils_common = require("../../utils/common.js");
if (!Math) {
  (DragFloatBtn + PopupModal)();
}
const DragFloatBtn = () => "../../components/drag-float-btn.js";
const PopupModal = () => "../../components/popup-modal.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const store = store_index.useAppStore();
    const { sortedStudents } = common_vendor.storeToRefs(store);
    const showPopup = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editingStudentId = common_vendor.ref(null);
    const currentStudent = common_vendor.ref(null);
    const editingStudentHours = common_vendor.computed(() => {
      if (!isEdit.value || editingStudentId.value === null)
        return "0.0";
      return store.getStudentHours(editingStudentId.value).toFixed(1);
    });
    const editingStudentRecordCount = common_vendor.computed(() => {
      if (!isEdit.value || editingStudentId.value === null)
        return 0;
      return store.getStudentRecords(editingStudentId.value).length;
    });
    const searchKeyword = common_vendor.ref("");
    const filteredStudents = common_vendor.computed(() => {
      if (!searchKeyword.value.trim()) {
        return sortedStudents.value;
      }
      const keyword = searchKeyword.value.trim().toLowerCase();
      return sortedStudents.value.filter(
        (student) => student.name.toLowerCase().includes(keyword)
      );
    });
    const activeStudents = common_vendor.computed(() => {
      return filteredStudents.value.filter((student) => !student.disabled);
    });
    const disabledStudents = common_vendor.computed(() => {
      return filteredStudents.value.filter((student) => student.disabled);
    });
    const onSearchInput = () => {
    };
    const clearSearch = () => {
      searchKeyword.value = "";
    };
    const studentForm = common_vendor.ref({
      name: "",
      disabled: false
    });
    const showAddPopup = () => {
      isEdit.value = false;
      editingStudentId.value = null;
      studentForm.value = {
        name: "",
        disabled: false
      };
      showPopup.value = true;
    };
    const closePopup = () => {
      showPopup.value = false;
      studentForm.value = {
        name: "",
        disabled: false
      };
    };
    const handlePageTouchMove = (e) => {
      if (showPopup.value) {
        e.preventDefault();
      }
    };
    const showActionSheet = (student) => {
      currentStudent.value = student;
      const toggleText = student.disabled ? "启用" : "禁用";
      common_vendor.index.showActionSheet({
        itemList: [toggleText, "编辑", "删除"],
        itemColor: "#333",
        success: (res) => {
          if (res.tapIndex === 0) {
            toggleStudentStatus(student);
          } else if (res.tapIndex === 1) {
            editStudent(student);
          } else if (res.tapIndex === 2) {
            deleteStudent(student);
          }
        }
      });
    };
    const toggleStudentStatus = (student) => {
      const action = student.disabled ? "启用" : "禁用";
      common_vendor.index.showModal({
        title: `确认${action}`,
        content: `确定要${action}学生"${student.name}"吗?`,
        confirmColor: "#ff6b7a",
        success: (res) => {
          if (res.confirm) {
            store.toggleStudentDisabled(student.id);
            common_vendor.index.showToast({ title: `已${action}`, icon: "success" });
          }
        }
      });
    };
    const editStudent = (student) => {
      isEdit.value = true;
      editingStudentId.value = student.id;
      studentForm.value = {
        name: student.name,
        disabled: student.disabled
      };
      showPopup.value = true;
    };
    const submitStudent = () => {
      if (!studentForm.value.name.trim()) {
        common_vendor.index.showToast({ title: "请输入学生姓名", icon: "none" });
        return;
      }
      if (isEdit.value && editingStudentId.value !== null) {
        store.updateStudent(editingStudentId.value, {
          name: studentForm.value.name.trim(),
          disabled: studentForm.value.disabled
        });
        common_vendor.index.showToast({ title: "修改成功", icon: "success" });
      } else {
        store.createNewStudent(studentForm.value.name.trim());
        common_vendor.index.showToast({ title: "添加成功", icon: "success" });
      }
      closePopup();
    };
    const onSwitchChange = (e) => {
      studentForm.value.disabled = !e.detail.value;
    };
    const deleteStudent = (student) => {
      const recordCount = store.getStudentRecords(student.id).length;
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除学生"${student.name}"吗?${recordCount > 0 ? `
该学生有 ${recordCount} 条课程记录,删除后无法恢复。` : ""}`,
        confirmColor: "#ff6b7a",
        success: (res) => {
          if (res.confirm) {
            store.deleteStudent(student.id);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(sortedStudents).length > 0
      }, common_vendor.unref(sortedStudents).length > 0 ? common_vendor.e({
        b: common_assets._imports_0$1,
        c: common_vendor.o([($event) => searchKeyword.value = $event.detail.value, onSearchInput], "7f"),
        d: searchKeyword.value,
        e: searchKeyword.value
      }, searchKeyword.value ? {
        f: common_vendor.o(clearSearch, "9d")
      } : {}) : {}, {
        g: filteredStudents.value.length > 0
      }, filteredStudents.value.length > 0 ? common_vendor.e({
        h: common_vendor.f(activeStudents.value, (student, k0, i0) => {
          return {
            a: common_vendor.t(student.name.charAt(0)),
            b: common_vendor.t(student.name),
            c: common_vendor.t(common_vendor.unref(utils_common.formatDateDisplay)(student.createTime)),
            d: student.id,
            e: common_vendor.o(($event) => showActionSheet(student), "35")
          };
        }),
        i: disabledStudents.value.length > 0
      }, disabledStudents.value.length > 0 ? {
        j: common_vendor.f(disabledStudents.value, (student, k0, i0) => {
          return {
            a: common_vendor.t(student.name.charAt(0)),
            b: common_vendor.t(student.name),
            c: common_vendor.t(common_vendor.unref(utils_common.formatDateDisplay)(student.createTime)),
            d: student.id,
            e: common_vendor.o(($event) => showActionSheet(student), "81")
          };
        })
      } : {}) : common_vendor.unref(sortedStudents).length > 0 && filteredStudents.value.length === 0 ? {
        l: common_vendor.t(searchKeyword.value)
      } : common_vendor.unref(sortedStudents).length === 0 ? {} : {}, {
        k: common_vendor.unref(sortedStudents).length > 0 && filteredStudents.value.length === 0,
        m: common_vendor.unref(sortedStudents).length === 0,
        n: common_vendor.o(showAddPopup, "61"),
        o: studentForm.value.name,
        p: common_vendor.o(($event) => studentForm.value.name = $event.detail.value, "fc"),
        q: !studentForm.value.disabled,
        r: common_vendor.o(onSwitchChange, "83"),
        s: common_vendor.t(studentForm.value.disabled ? "已禁用" : "已启用"),
        t: isEdit.value
      }, isEdit.value ? {
        v: common_vendor.t(editingStudentHours.value),
        w: common_vendor.t(editingStudentRecordCount.value)
      } : {}, {
        x: common_vendor.o(closePopup, "74"),
        y: common_vendor.o(submitStudent, "7e"),
        z: common_vendor.p({
          visible: showPopup.value,
          title: isEdit.value ? "编辑学生" : "添加学生",
          submitText: isEdit.value ? "保存修改" : "确认添加"
        }),
        A: showPopup.value ? 1 : "",
        B: common_vendor.o(handlePageTouchMove, "4b")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c78e6e6b"]]);
my.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-alipay/pages/student/index.js.map
