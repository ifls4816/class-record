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
    const { students, classData, activeStudents } = common_vendor.storeToRefs(store);
    const currentYear = common_vendor.ref(common_vendor.dayjs().year());
    const currentMonth = common_vendor.ref(common_vendor.dayjs().month() + 1);
    const selectedDate = common_vendor.ref(common_vendor.dayjs().format("YYYY-MM-DD"));
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    const showPopup = common_vendor.ref(false);
    const isEdit = common_vendor.ref(false);
    const editingRecordIndex = common_vendor.ref(-1);
    const currentRecord = common_vendor.ref(null);
    const currentRecordIndex = common_vendor.ref(-1);
    const recordForm = common_vendor.ref({
      studentId: null,
      date: common_vendor.dayjs().format("YYYY-MM-DD"),
      startTime: "",
      endTime: "",
      isFuture: false
    });
    const calendarDays = common_vendor.computed(() => {
      const year = currentYear.value;
      const month = currentMonth.value;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      const startWeekday = firstDay.getDay();
      const days = [];
      for (let i = 0; i < startWeekday; i++) {
        days.push({
          date: null,
          dateStr: "",
          isToday: false,
          hasRecord: false,
          hasFutureRecord: false,
          hasNormalRecord: false
        });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i);
        const dateStr = common_vendor.dayjs(date).format("YYYY-MM-DD");
        const today = common_vendor.dayjs().format("YYYY-MM-DD");
        const records = getRecordsOnDate(dateStr);
        const hasFuture = records.some((r) => r.isFuture);
        const hasNormal = records.some((r) => !r.isFuture);
        days.push({
          date,
          dateStr,
          isToday: dateStr === today,
          hasRecord: records.length > 0,
          hasFutureRecord: hasFuture,
          hasNormalRecord: hasNormal
        });
      }
      return days;
    });
    const activeStudentNames = common_vendor.computed(
      () => activeStudents.value.map((s) => s.name)
    );
    const selectedStudentName = common_vendor.computed(() => {
      const student = students.value.find((s) => s.id === recordForm.value.studentId);
      return student ? student.name : "";
    });
    const todayRecords = common_vendor.computed(() => {
      var _a, _b;
      const [year, month, day] = utils_common.parseDate(selectedDate.value);
      return ((_b = (_a = classData.value[year]) == null ? void 0 : _a[month]) == null ? void 0 : _b[day]) || [];
    });
    const selectedDateStr = common_vendor.computed(
      () => common_vendor.dayjs(selectedDate.value).format("MM月DD日")
    );
    const calculatedDuration = common_vendor.computed(() => {
      if (!recordForm.value.startTime || !recordForm.value.endTime)
        return 0;
      return utils_common.calculateTimeDiff(recordForm.value.startTime, recordForm.value.endTime);
    });
    const getRecordsOnDate = (dateStr) => {
      var _a, _b;
      const [year, month, day] = utils_common.parseDate(dateStr);
      return ((_b = (_a = classData.value[year]) == null ? void 0 : _a[month]) == null ? void 0 : _b[day]) || [];
    };
    const selectDate = (day) => {
      if (day.date) {
        selectedDate.value = day.dateStr;
      }
    };
    const prevMonth = () => {
      if (currentMonth.value === 1) {
        currentYear.value--;
        currentMonth.value = 12;
      } else {
        currentMonth.value--;
      }
    };
    const nextMonth = () => {
      if (currentMonth.value === 12) {
        currentYear.value++;
        currentMonth.value = 1;
      } else {
        currentMonth.value++;
      }
    };
    const getLastRecordEndTime = () => {
      const records = todayRecords.value;
      if (records.length > 0) {
        const sorted = [...records].sort((a, b) => b.time[1].localeCompare(a.time[1]));
        return sorted[0].time[1];
      }
      return null;
    };
    const getRecommendedStartTime = () => {
      const lastEndTime = getLastRecordEndTime();
      if (lastEndTime) {
        const [hours, minutes] = lastEndTime.split(":").map(Number);
        const endTimeMinutes = hours * 60 + minutes;
        const lunchStartMinutes = 12 * 60;
        const lunchEndMinutes = 13 * 60;
        if (endTimeMinutes >= lunchStartMinutes && endTimeMinutes < lunchEndMinutes) {
          return "13:00";
        }
        return lastEndTime;
      } else {
        return "08:00";
      }
    };
    const getRecommendedEndTime = (startTime) => {
      if (!startTime)
        return "";
      const [hours, minutes] = startTime.split(":").map(Number);
      let endHours = hours + 2;
      let endMinutes = minutes;
      if (endHours >= 24) {
        endHours = 23;
        endMinutes = 59;
      }
      return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
    };
    const showAddPopup = () => {
      isEdit.value = false;
      editingRecordIndex.value = -1;
      recordForm.value.date = selectedDate.value;
      const recommendedStart = getRecommendedStartTime();
      recordForm.value.startTime = recommendedStart;
      recordForm.value.endTime = getRecommendedEndTime(recommendedStart);
      showPopup.value = true;
    };
    const closePopup = () => {
      showPopup.value = false;
      resetForm();
    };
    const handlePageTouchMove = (e) => {
      if (showPopup.value) {
        e.preventDefault();
      }
    };
    const resetForm = () => {
      recordForm.value = {
        studentId: null,
        date: common_vendor.dayjs().format("YYYY-MM-DD"),
        startTime: "",
        endTime: "",
        isFuture: false
      };
    };
    const onStudentChange = (e) => {
      const index = e.detail.value;
      recordForm.value.studentId = activeStudents.value[index].id;
    };
    const onDateChange = (e) => {
      recordForm.value.date = e.detail.value;
    };
    const onStartTimeChange = (e) => {
      recordForm.value.startTime = e.detail.value;
      recordForm.value.endTime = getRecommendedEndTime(e.detail.value);
    };
    const onEndTimeChange = (e) => {
      recordForm.value.endTime = e.detail.value;
    };
    const onFutureChange = (e) => {
      recordForm.value.isFuture = e.detail.value;
    };
    const showActionSheet = (record, index) => {
      currentRecord.value = record;
      currentRecordIndex.value = index;
      const itemList = record.isFuture ? ["已上课", "编辑", "删除"] : ["编辑", "删除"];
      common_vendor.index.showActionSheet({
        itemList,
        itemColor: "#333",
        success: (res) => {
          if (record.isFuture) {
            if (res.tapIndex === 0) {
              markAsAttended(record, index);
            } else if (res.tapIndex === 1) {
              editRecord(record, index);
            } else if (res.tapIndex === 2) {
              deleteRecord(record, index);
            }
          } else {
            if (res.tapIndex === 0) {
              editRecord(record, index);
            } else if (res.tapIndex === 1) {
              deleteRecord(record, index);
            }
          }
        }
      });
    };
    const markAsAttended = (record, index) => {
      const studentName = getStudentName(record.studentId);
      common_vendor.index.showModal({
        title: "确认已上课",
        content: `确定将 ${studentName} 的未来课时标记为已上课吗？`,
        confirmColor: "#ff6b7a",
        success: (res) => {
          if (res.confirm) {
            store.markAsAttended(selectedDate.value, index);
            common_vendor.index.showToast({ title: "已标记为已上课", icon: "success" });
          }
        }
      });
    };
    const editRecord = (record, index) => {
      isEdit.value = true;
      editingRecordIndex.value = index;
      recordForm.value = {
        studentId: record.studentId,
        date: selectedDate.value,
        startTime: record.time[0],
        endTime: record.time[1],
        isFuture: record.isFuture || false
      };
      showPopup.value = true;
    };
    const submitRecord = () => {
      if (!recordForm.value.studentId) {
        common_vendor.index.showToast({ title: "请选择学生", icon: "none" });
        return;
      }
      if (!recordForm.value.date) {
        common_vendor.index.showToast({ title: "请选择日期", icon: "none" });
        return;
      }
      if (!recordForm.value.startTime || !recordForm.value.endTime) {
        common_vendor.index.showToast({ title: "请选择上课时间", icon: "none" });
        return;
      }
      if (calculatedDuration.value <= 0) {
        common_vendor.index.showToast({ title: "结束时间必须大于开始时间", icon: "none" });
        return;
      }
      if (isEdit.value) {
        store.deleteClassRecord(recordForm.value.date, editingRecordIndex.value);
        store.createClassRecordAction(
          recordForm.value.date,
          recordForm.value.studentId,
          recordForm.value.startTime,
          recordForm.value.endTime,
          recordForm.value.isFuture
        );
        common_vendor.index.showToast({ title: "修改成功", icon: "success" });
      } else {
        store.createClassRecordAction(
          recordForm.value.date,
          recordForm.value.studentId,
          recordForm.value.startTime,
          recordForm.value.endTime,
          recordForm.value.isFuture
        );
        common_vendor.index.showToast({ title: "添加成功", icon: "success" });
      }
      closePopup();
    };
    const getStudentName = (studentId) => {
      const student = students.value.find((s) => s.id === studentId);
      return student ? student.name : "未知学生";
    };
    const deleteRecord = (record, index) => {
      const studentName = getStudentName(record.studentId);
      const dateStr = common_vendor.dayjs(selectedDate.value).format("MM月DD日");
      const timeStr = `${record.time[0]}-${record.time[1]}`;
      common_vendor.index.showModal({
        title: "确认删除",
        content: `确定要删除 ${studentName} 的课程记录吗?
日期：${dateStr}
时间：${timeStr}`,
        confirmColor: "#ff6b7a",
        success: (res) => {
          if (res.confirm) {
            store.deleteClassRecord(selectedDate.value, index);
            common_vendor.index.showToast({ title: "已删除", icon: "success" });
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(prevMonth, "b1"),
        b: common_vendor.t(currentYear.value),
        c: common_vendor.t(currentMonth.value),
        d: common_vendor.o(nextMonth, "7e"),
        e: common_vendor.f(weekDays, (day, k0, i0) => {
          return {
            a: common_vendor.t(day),
            b: day
          };
        }),
        f: common_vendor.f(calendarDays.value, (day, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(day.date ? day.date.getDate() : ""),
            b: day.hasRecord
          }, day.hasRecord ? common_vendor.e({
            c: day.hasNormalRecord
          }, day.hasNormalRecord ? {} : {}, {
            d: day.hasFutureRecord
          }, day.hasFutureRecord ? {} : {}) : {}, {
            e: day.dateStr || `empty-${index}`,
            f: !day.date ? 1 : "",
            g: day.isToday ? 1 : "",
            h: day.dateStr === selectedDate.value ? 1 : "",
            i: day.hasRecord ? 1 : "",
            j: common_vendor.o(($event) => selectDate(day), "7f")
          });
        }),
        g: selectedDate.value
      }, selectedDate.value ? {
        h: common_vendor.t(selectedDateStr.value),
        i: common_vendor.t(todayRecords.value.length)
      } : {}, {
        j: todayRecords.value.length > 0
      }, todayRecords.value.length > 0 ? {
        k: common_vendor.f(todayRecords.value, (record, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(record.time[0]),
            b: common_vendor.t(record.time[1]),
            c: common_vendor.t(getStudentName(record.studentId)),
            d: record.isFuture
          }, record.isFuture ? {} : {}, {
            e: common_vendor.t(record.timeDiff),
            f: record.isFuture ? 1 : "",
            g: `${record.studentId}-${record.time[0]}-${index}`,
            h: common_vendor.o(($event) => showActionSheet(record, index), "32")
          });
        }),
        l: common_assets._imports_0,
        m: common_assets._imports_1
      } : {}, {
        n: common_vendor.o(showAddPopup, "5c"),
        o: common_vendor.t(selectedStudentName.value || "请选择学生"),
        p: activeStudentNames.value,
        q: common_vendor.o(onStudentChange, "c9"),
        r: common_vendor.t(recordForm.value.date || "请选择日期"),
        s: recordForm.value.date,
        t: common_vendor.o(onDateChange, "31"),
        v: common_vendor.t(recordForm.value.startTime || "开始"),
        w: recordForm.value.startTime,
        x: common_vendor.o(onStartTimeChange, "e9"),
        y: common_vendor.t(recordForm.value.endTime || "结束"),
        z: recordForm.value.endTime,
        A: common_vendor.o(onEndTimeChange, "5b"),
        B: recordForm.value.startTime && recordForm.value.endTime
      }, recordForm.value.startTime && recordForm.value.endTime ? {
        C: common_vendor.t(calculatedDuration.value),
        D: recordForm.value.isFuture,
        E: common_vendor.o(onFutureChange, "4a")
      } : {}, {
        F: common_vendor.o(closePopup, "a0"),
        G: common_vendor.o(submitRecord, "f4"),
        H: common_vendor.p({
          visible: showPopup.value,
          title: isEdit.value ? "编辑记录" : "添加记录",
          submitText: isEdit.value ? "保存修改" : "确认添加"
        }),
        I: showPopup.value ? 1 : "",
        J: common_vendor.o(handlePageTouchMove, "4b")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4978fed5"]]);
my.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-alipay/pages/home/index.js.map
