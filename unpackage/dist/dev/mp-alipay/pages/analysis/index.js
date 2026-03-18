"use strict";
const common_vendor = require("../../common/vendor.js");
const store_index = require("../../store/index.js");
if (!Math) {
  PopupModal();
}
const PopupModal = () => "../../components/popup-modal.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "index",
  setup(__props) {
    const store = store_index.useAppStore();
    const { students, classData } = common_vendor.storeToRefs(store);
    const viewMode = common_vendor.ref("month");
    const selectedYear = common_vendor.ref(common_vendor.dayjs().year());
    const selectedMonth = common_vendor.ref(common_vendor.dayjs().month() + 1);
    const displayText = common_vendor.computed(() => {
      if (viewMode.value === "month") {
        return `${selectedYear.value}年${selectedMonth.value}月`;
      } else {
        return `${selectedYear.value}年`;
      }
    });
    const toggleViewMode = () => {
      viewMode.value = viewMode.value === "month" ? "year" : "month";
    };
    const prevPeriod = () => {
      if (viewMode.value === "month") {
        const current = common_vendor.dayjs(`${selectedYear.value}-${selectedMonth.value}-01`);
        const prev = current.subtract(1, "month");
        selectedYear.value = prev.year();
        selectedMonth.value = prev.month() + 1;
      } else {
        selectedYear.value -= 1;
      }
    };
    const nextPeriod = () => {
      if (viewMode.value === "month") {
        const current = common_vendor.dayjs(`${selectedYear.value}-${selectedMonth.value}-01`);
        const next = current.add(1, "month");
        selectedYear.value = next.year();
        selectedMonth.value = next.month() + 1;
      } else {
        selectedYear.value += 1;
      }
    };
    const timeRange = common_vendor.computed(() => {
      if (viewMode.value === "month") {
        const current = common_vendor.dayjs(`${selectedYear.value}-${selectedMonth.value}-01`);
        return {
          year: selectedYear.value,
          month: selectedMonth.value,
          start: current.startOf("month").format("YYYY-MM-DD"),
          end: current.endOf("month").format("YYYY-MM-DD")
        };
      } else {
        const current = common_vendor.dayjs(`${selectedYear.value}-01-01`);
        return {
          year: selectedYear.value,
          month: null,
          start: current.startOf("year").format("YYYY-MM-DD"),
          end: current.endOf("year").format("YYYY-MM-DD")
        };
      }
    });
    const filteredRecords = common_vendor.computed(() => {
      var _a;
      const records = [];
      const { year, month } = timeRange.value;
      if (month) {
        const monthData = (_a = classData.value[year]) == null ? void 0 : _a[month];
        if (monthData) {
          Object.entries(monthData).forEach(([day, dayRecords]) => {
            dayRecords.forEach((record) => {
              if (record.isFuture)
                return;
              records.push({
                ...record,
                date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              });
            });
          });
        }
      } else {
        const yearData = classData.value[year];
        if (yearData) {
          Object.entries(yearData).forEach(([month2, monthData]) => {
            Object.entries(monthData).forEach(([day, dayRecords]) => {
              dayRecords.forEach((record) => {
                if (record.isFuture)
                  return;
                records.push({
                  ...record,
                  date: `${year}-${String(month2).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                });
              });
            });
          });
        }
      }
      return records;
    });
    const totalMinutes = common_vendor.computed(
      () => filteredRecords.value.reduce((sum, r) => sum + (r.timeDiff || 0), 0)
    );
    const totalHours = common_vendor.computed(
      () => (totalMinutes.value / 60).toFixed(1)
    );
    const groupedRankingList = common_vendor.computed(() => {
      const studentStats = {};
      filteredRecords.value.forEach((record) => {
        if (!record.studentId)
          return;
        if (!studentStats[record.studentId]) {
          const student = students.value.find((s) => s.id === record.studentId);
          const nameParts = student ? student.name.split("-") : ["未知学生"];
          const studentName = nameParts[0].trim();
          const teacherName = nameParts.length > 1 ? nameParts[1].trim() : "未分类";
          studentStats[record.studentId] = {
            studentId: record.studentId,
            studentName,
            teacherName,
            totalMinutes: 0,
            recordCount: 0,
            totalHours: "0.0"
          };
        }
        studentStats[record.studentId].totalMinutes += record.timeDiff || 0;
        studentStats[record.studentId].recordCount += 1;
      });
      const sortedList = Object.values(studentStats).map((stat) => ({
        ...stat,
        totalHours: (stat.totalMinutes / 60).toFixed(1)
      })).sort((a, b) => b.totalMinutes - a.totalMinutes);
      const groups = {};
      sortedList.forEach((item) => {
        if (!groups[item.teacherName]) {
          groups[item.teacherName] = [];
        }
        groups[item.teacherName].push(item);
      });
      return Object.entries(groups).map(([teacherName, students2]) => {
        const totalMinutes2 = students2.reduce((sum, s) => sum + s.totalMinutes, 0);
        return {
          teacherName,
          students: students2,
          totalMinutes: totalMinutes2,
          totalHours: (totalMinutes2 / 60).toFixed(1)
        };
      }).sort((a, b) => b.totalMinutes - a.totalMinutes);
    });
    const showDetailPopup = common_vendor.ref(false);
    const selectedStudent = common_vendor.ref(null);
    const studentDetailList = common_vendor.computed(() => {
      if (!selectedStudent.value)
        return [];
      const records = [];
      const studentId = selectedStudent.value.studentId;
      filteredRecords.value.forEach((record) => {
        if (record.studentId !== studentId)
          return;
        if (!record.date)
          return;
        const [startTime, endTime] = record.time || [];
        records.push({
          date: record.date,
          displayDate: common_vendor.dayjs(record.date).format("M月D日"),
          startTime: startTime || "",
          endTime: endTime || "",
          timeDiff: record.timeDiff || 0,
          hours: ((record.timeDiff || 0) / 60).toFixed(1)
        });
      });
      return records.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    });
    const showStudentDetail = (item) => {
      selectedStudent.value = item;
      showDetailPopup.value = true;
    };
    const closeDetailPopup = () => {
      showDetailPopup.value = false;
    };
    const handlePageTouchMove = (e) => {
      if (showDetailPopup.value) {
        e.preventDefault();
      }
    };
    return (_ctx, _cache) => {
      var _a, _b;
      return common_vendor.e({
        a: common_vendor.o(prevPeriod, "b1"),
        b: common_vendor.t(displayText.value),
        c: common_vendor.o(toggleViewMode, "b6"),
        d: common_vendor.o(nextPeriod, "3b"),
        e: common_vendor.t(totalHours.value),
        f: groupedRankingList.value.length > 0
      }, groupedRankingList.value.length > 0 ? {
        g: common_vendor.f(groupedRankingList.value, (group, k0, i0) => {
          return {
            a: common_vendor.t(group.teacherName),
            b: common_vendor.t(group.totalHours),
            c: common_vendor.f(group.students, (item, k1, i1) => {
              return {
                a: common_vendor.t(item.studentName),
                b: common_vendor.t(item.totalHours),
                c: item.studentId,
                d: common_vendor.o(($event) => showStudentDetail(item), "65")
              };
            }),
            d: group.teacherName
          };
        })
      } : {}, {
        h: common_vendor.t((_a = selectedStudent.value) == null ? void 0 : _a.totalHours),
        i: studentDetailList.value.length > 0
      }, studentDetailList.value.length > 0 ? {
        j: common_vendor.f(studentDetailList.value, (record, index, i0) => {
          return {
            a: common_vendor.t(record.displayDate),
            b: common_vendor.t(record.startTime),
            c: common_vendor.t(record.endTime),
            d: common_vendor.t(record.hours),
            e: record.date + record.startTime
          };
        })
      } : {}, {
        k: common_vendor.o(closeDetailPopup, "6c"),
        l: common_vendor.o(closeDetailPopup, "9d"),
        m: common_vendor.p({
          visible: showDetailPopup.value,
          title: ((_b = selectedStudent.value) == null ? void 0 : _b.studentName) || "",
          submitText: ""
        }),
        n: showDetailPopup.value ? 1 : "",
        o: common_vendor.o(handlePageTouchMove, "91")
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-49fa13a1"]]);
my.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-alipay/pages/analysis/index.js.map
