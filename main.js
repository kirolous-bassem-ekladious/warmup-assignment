const fs = require("fs");
// HELPER: Convert a time string like "6:01:20 am" to total seconds since midnight
// ============================================================
function timeToSeconds(timeStr) {
  // timeStr looks like "6:01:20 am" or "12:30:00 pm"
  timeStr = timeStr.trim();
  const parts = timeStr.split(" "); // ["6:01:20", "am"]
  const period = parts[1].toLowerCase(); // "am" or "pm"
  const timeParts = parts[0].split(":"); // ["6", "01", "20"]

  let hours = parseInt(timeParts[0]);
  let minutes = parseInt(timeParts[1]);
  let seconds = parseInt(timeParts[2]);
 
  // Convert 12-hour format to 24-hour format
  if (period === "am") {
    if (hours === 12) hours = 0; // 12:xx am = 0:xx in 24h
  } else {
    // pm
    if (hours !== 12) hours += 12; // 1pm=13, 2pm=14... but 12pm stays 12
  }
 
  return hours * 3600 + minutes * 60 + seconds;
}
// ============================================================
// HELPER: Convert a duration string like "6:40:20" (h:mm:ss) to total seconds
// ============================================================
function durationToSeconds(durStr) {
  durStr = durStr.trim();
  const parts = durStr.split(":");
  let hours = parseInt(parts[0]);
  let minutes = parseInt(parts[1]);
  let seconds = parseInt(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
}

// ============================================================
// HELPER: Convert total seconds to "h:mm:ss" format
// ============================================================
function secondsToDuration(totalSec) {
  let hours = Math.floor(totalSec / 3600);
  let remaining = totalSec % 3600;
  let minutes = Math.floor(remaining / 60);
  let seconds = remaining % 60;
  // Format: h:mm:ss (hours NOT zero-padded, minutes and seconds are)
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
 
// ============================================================
// HELPER: Convert total seconds to "hhh:mm:ss" format (for large totals)
// ============================================================
function secondsToLargeDuration(totalSec) {
  let hours = Math.floor(totalSec / 3600);
  let remaining = totalSec % 3600;
  let minutes = Math.floor(remaining / 60);
  let seconds = remaining % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
 
// ============================================================

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
  const startSec = timeToSeconds(startTime);
  const endSec = timeToSeconds(endTime);

  let diff = endSec - startSec;

  // Handle overnight shifts safely
  if (diff < 0) diff += 24 * 3600;

  return secondsToDuration(diff);
}


// ============================================================
// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
  const startSec = timeToSeconds(startTime);
  const endSec = timeToSeconds(endTime);

  const deliveryStart = 8 * 3600;
  const deliveryEnd = 22 * 3600;

  let idle = 0;

  if (startSec < deliveryStart) {
    idle += Math.max(0, Math.min(endSec, deliveryStart) - startSec);
  }

  if (endSec > deliveryEnd) {
    idle += Math.max(0, endSec - Math.max(startSec, deliveryEnd));
  }

  return secondsToDuration(idle);
}




// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function

  const shiftSec = durationToSeconds(shiftDuration);
  const idleSec = durationToSeconds(idleTime);

  const active = Math.max(0, shiftSec - idleSec);

  return secondsToDuration(active);
}


// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
  const parts = date.trim().split("-");

  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);

  let quotaSeconds;

  if (year === 2025 && month === 4 && day >= 10 && day <= 30) {
    quotaSeconds = 6 * 3600;
  } else {
    quotaSeconds = 8 * 3600 + 24 * 60;
  }

  const activeSec = durationToSeconds(activeTime);

  return activeSec >= quotaSeconds;
}
// ============================================================
// HELPER
// ==========================================================
function readShiftLines(textFile) {
  const content = fs.readFileSync(textFile, "utf-8");

  return content.split(/\r?\n/).filter((line) => line.trim() !== "");
}

// ============================================================
// HELPER
// ============================================================
function parseShiftLine(line) {
  const parts = line.split(",");

  return {
    driverID: parts[0].trim(),
    driverName: parts[1].trim(),
    date: parts[2].trim(),
    startTime: parts[3].trim(),
    endTime: parts[4].trim(),
    shiftDuration: parts[5].trim(),
    idleTime: parts[6].trim(),
    activeTime: parts[7].trim(),
    metQuota: parts[8].trim() === "true",
    hasBonus: parts[9].trim() === "true",
  };
}

// ============================================================
// HELPER
// ============================================================
function shiftObjToLine(obj) {
  return `${obj.driverID},${obj.driverName},${obj.date},${obj.startTime},${obj.endTime},${obj.shiftDuration},${obj.idleTime},${obj.activeTime},${obj.metQuota},${obj.hasBonus}`;
}


// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
