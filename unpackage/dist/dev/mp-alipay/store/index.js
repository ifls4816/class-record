"use strict";
const common_vendor = require("../common/vendor.js");
const utils_common = require("../utils/common.js");
const utils_webdav = require("../utils/webdav.js");
const SYNC_DEBOUNCE_DELAY = 3e3;
const STORAGE_KEYS = {
  STUDENTS: "class_record_students",
  CLASS: "class_record_class"
};
const useAppStore = common_vendor.defineStore("app", () => {
  const students = common_vendor.ref([]);
  const classData = common_vendor.ref({});
  const sortedStudents = common_vendor.computed(() => {
    return [...students.value].sort((a, b) => {
      if (a.disabled !== b.disabled) {
        return a.disabled ? 1 : -1;
      }
      const timeA = a.createTime ? new Date(a.createTime).getTime() : a.id;
      const timeB = b.createTime ? new Date(b.createTime).getTime() : b.id;
      return timeB - timeA;
    });
  });
  const activeStudents = common_vendor.computed(() => sortedStudents.value.filter((s) => !s.disabled));
  const totalRecords = common_vendor.computed(() => {
    let count = 0;
    Object.values(classData.value).forEach((yearData) => {
      Object.values(yearData).forEach((monthData) => {
        Object.values(monthData).forEach((dayRecords) => {
          count += dayRecords.length;
        });
      });
    });
    return count;
  });
  const nextStudentId = common_vendor.computed(() => {
    if (students.value.length === 0)
      return 1;
    const sorted = [...students.value].sort((a, b) => a.id - b.id);
    return sorted[sorted.length - 1].id + 1;
  });
  function initData() {
    try {
      const storedStudents = common_vendor.index.getStorageSync(STORAGE_KEYS.STUDENTS);
      const storedClassData = common_vendor.index.getStorageSync(STORAGE_KEYS.CLASS);
      students.value = storedStudents || [];
      classData.value = storedClassData || {};
      common_vendor.index.__f__("log", "at store/index.ts:76", "数据初始化完成", {
        studentCount: students.value.length,
        hasClassData: Object.keys(classData.value).length > 0
      });
    } catch (e) {
      common_vendor.index.__f__("error", "at store/index.ts:81", "数据初始化失败", e);
      students.value = [];
      classData.value = {};
    }
  }
  function addStudent(student) {
    students.value.push(student);
    common_vendor.index.setStorageSync(STORAGE_KEYS.STUDENTS, students.value);
    triggerSync();
  }
  function updateStudent(id, updates) {
    const index = students.value.findIndex((s) => s.id === id);
    if (index !== -1) {
      students.value[index] = { ...students.value[index], ...updates };
      common_vendor.index.setStorageSync(STORAGE_KEYS.STUDENTS, students.value);
      triggerSync();
    }
  }
  function deleteStudent(id) {
    const index = students.value.findIndex((s) => s.id === id);
    if (index !== -1) {
      students.value.splice(index, 1);
      common_vendor.index.setStorageSync(STORAGE_KEYS.STUDENTS, students.value);
      triggerSync();
    }
  }
  function toggleStudentDisabled(id) {
    const student = students.value.find((s) => s.id === id);
    if (student) {
      student.disabled = !student.disabled;
      common_vendor.index.setStorageSync(STORAGE_KEYS.STUDENTS, students.value);
      triggerSync();
    }
  }
  function addClassRecord(date, classItem) {
    const [year, month, day] = utils_common.parseDate(date);
    if (!classData.value[year]) {
      classData.value[year] = {};
    }
    if (!classData.value[year][month]) {
      classData.value[year][month] = {};
    }
    if (!classData.value[year][month][day]) {
      classData.value[year][month][day] = [];
    }
    classData.value[year][month][day].push(classItem);
    classData.value[year][month][day].sort((a, b) => {
      return a.time[0].slice(0, 2).localeCompare(b.time[0].slice(0, 2));
    });
    common_vendor.index.setStorageSync(STORAGE_KEYS.CLASS, classData.value);
    triggerSync();
  }
  function deleteClassRecord(date, index) {
    var _a, _b;
    const [year, month, day] = utils_common.parseDate(date);
    if ((_b = (_a = classData.value[year]) == null ? void 0 : _a[month]) == null ? void 0 : _b[day]) {
      classData.value[year][month][day].splice(index, 1);
      if (classData.value[year][month][day].length === 0) {
        delete classData.value[year][month][day];
        if (Object.keys(classData.value[year][month]).length === 0) {
          delete classData.value[year][month];
          if (Object.keys(classData.value[year]).length === 0) {
            delete classData.value[year];
          }
        }
      }
      common_vendor.index.setStorageSync(STORAGE_KEYS.CLASS, classData.value);
      triggerSync();
    }
  }
  function clearAllData() {
    students.value = [];
    classData.value = {};
    common_vendor.index.removeStorageSync(STORAGE_KEYS.STUDENTS);
    common_vendor.index.removeStorageSync(STORAGE_KEYS.CLASS);
  }
  function restoreData(data) {
    if (data.students && Array.isArray(data.students)) {
      students.value = data.students;
      common_vendor.index.setStorageSync(STORAGE_KEYS.STUDENTS, data.students);
    }
    const classDataValue = data.classData || data.class;
    if (classDataValue && typeof classDataValue === "object") {
      classData.value = classDataValue;
      common_vendor.index.setStorageSync(STORAGE_KEYS.CLASS, classDataValue);
    }
  }
  function getClassByDate(date) {
    var _a, _b;
    const [year, month, day] = utils_common.parseDate(date);
    return ((_b = (_a = classData.value[year]) == null ? void 0 : _a[month]) == null ? void 0 : _b[day]) || [];
  }
  function getClassByMonth(year, month) {
    var _a;
    if ((_a = classData.value[year]) == null ? void 0 : _a[month]) {
      const days = classData.value[year][month];
      return Object.values(days).flat(Infinity);
    }
    return [];
  }
  function getStudentStats(studentId) {
    const records = [];
    let totalMinutes = 0;
    Object.values(classData.value).forEach((yearData) => {
      Object.values(yearData).forEach((monthData) => {
        Object.values(monthData).forEach((dayRecords) => {
          dayRecords.forEach((record) => {
            if (record.studentId === studentId && !record.isFuture) {
              records.push(record);
              totalMinutes += record.timeDiff || 0;
            }
          });
        });
      });
    });
    return { records, totalMinutes };
  }
  function getStudentRecords(studentId) {
    return getStudentStats(studentId).records;
  }
  function getStudentHours(studentId) {
    return utils_common.minutesToHours(getStudentStats(studentId).totalMinutes);
  }
  async function createNewStudent(name) {
    const student = utils_common.createStudent(nextStudentId.value, name);
    addStudent(student);
    return student;
  }
  async function createClassRecordAction(date, studentId, startTime, endTime, isFuture = false) {
    const classItem = utils_common.createTodayClass(studentId, startTime, endTime, isFuture);
    addClassRecord(date, classItem);
    return classItem;
  }
  function markAsAttended(date, index) {
    var _a, _b;
    const [year, month, day] = utils_common.parseDate(date);
    const records = (_b = (_a = classData.value[year]) == null ? void 0 : _a[month]) == null ? void 0 : _b[day];
    if (records && records[index]) {
      records[index].isFuture = false;
      common_vendor.index.setStorageSync(STORAGE_KEYS.CLASS, classData.value);
      triggerSync();
    }
  }
  async function syncToWebDAV() {
    if (!utils_webdav.isWebDAVConfigured()) {
      common_vendor.index.__f__("log", "at store/index.ts:261", "WebDAV 未配置，跳过同步");
      return false;
    }
    const data = {
      students: students.value,
      classData: classData.value,
      syncTime: (/* @__PURE__ */ new Date()).toISOString()
    };
    return await utils_webdav.uploadToWebDAV(data);
  }
  async function syncFromWebDAV() {
    if (!utils_webdav.isWebDAVConfigured()) {
      common_vendor.index.__f__("log", "at store/index.ts:276", "WebDAV 未配置，跳过恢复");
      return false;
    }
    const data = await utils_webdav.downloadFromWebDAV();
    if (data) {
      restoreData(data);
      return true;
    }
    return false;
  }
  const debouncedSync = utils_common.debounce(async () => {
    const success = await syncToWebDAV();
    if (success) {
      common_vendor.index.__f__("log", "at store/index.ts:292", "数据变更后自动同步成功");
    }
  }, SYNC_DEBOUNCE_DELAY);
  function triggerSync() {
    debouncedSync();
  }
  initData();
  return {
    // State
    students,
    classData,
    // Getters
    sortedStudents,
    activeStudents,
    totalRecords,
    nextStudentId,
    // Actions
    initData,
    addStudent,
    updateStudent,
    deleteStudent,
    toggleStudentDisabled,
    addClassRecord,
    deleteClassRecord,
    clearAllData,
    restoreData,
    getClassByDate,
    getClassByMonth,
    getStudentRecords,
    getStudentHours,
    createNewStudent,
    createClassRecordAction,
    markAsAttended,
    syncToWebDAV,
    syncFromWebDAV,
    triggerSync
  };
});
exports.useAppStore = useAppStore;
//# sourceMappingURL=../../.sourcemap/mp-alipay/store/index.js.map
