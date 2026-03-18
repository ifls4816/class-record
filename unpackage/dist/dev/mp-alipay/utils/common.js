"use strict";
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}
function createStudent(id, name) {
  return {
    id,
    name,
    createTime: formatDate(/* @__PURE__ */ new Date()),
    disabled: false
  };
}
function createTodayClass(studentId, startTime, endTime, isFuture = false) {
  const timeDiff = calculateTimeDiff(startTime, endTime);
  return {
    studentId,
    time: [startTime, endTime],
    timeDiff,
    isFuture
  };
}
function calculateTimeDiff(startTime, endTime) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDateDisplay(dateStr) {
  if (!dateStr)
    return "";
  return dateStr.split("T")[0].split(" ")[0];
}
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return [year, month, day];
}
function minutesToHours(minutes) {
  return minutes / 60;
}
exports.calculateTimeDiff = calculateTimeDiff;
exports.createStudent = createStudent;
exports.createTodayClass = createTodayClass;
exports.debounce = debounce;
exports.formatDateDisplay = formatDateDisplay;
exports.minutesToHours = minutesToHours;
exports.parseDate = parseDate;
//# sourceMappingURL=../../.sourcemap/mp-alipay/utils/common.js.map
