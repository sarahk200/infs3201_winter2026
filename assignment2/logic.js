const storage = require('./storage')

/**
 * Return a list of all employees loaded from the storage.
 */
async function getAllEmployees() {
    return await storage.getAllEmployees()
}

/**
 * Add a new employee record to the system.
 */
async function addEmployeeRecord(emp) {
    await storage.addEmployeeRecord(emp)
}

/**
 * Get a list of shift details for an employee.
 */
async function getEmployeeShifts(empId) {
    return await storage.getEmployeeShifts(empId)
}

/**
 *  24-hour format and returns a number of hours between them as a real number (e.g., 11:00 to 13:30 => 2.5).
 *  Assume same-day times
 */
function computeShiftDuration(startTime, endTime) {
    let s = startTime.split(':')
    let e = endTime.split(':')

    let startMins = Number(s[0]) * 60 + Number(s[1])
    let endMins = Number(e[0]) * 60 + Number(e[1])

    if (endMins < startMins) {
        endMins = endMins + 24 * 60
    }

    return (endMins - startMins) / 60
}

/**
 * Assign shift (same instructor checks) and NEW daily-hours limit feature.
 */
async function assignShift(empId, shiftId) {
    // check that empId exists
    let employee = await storage.findEmployee(empId)
    if (!employee) {
        return "Employee does not exist"
    }

    // check that shiftId exists
    let shift = await storage.findShift(shiftId)
    if (!shift) {
        return "Shift does not exist"
    }

    // check that empId,shiftId doesn't exist
    let assignment = await storage.findAssignment(empId, shiftId)
    if (assignment) {
        return "Employee already assigned to shift"
    }

    // NEW FEATURE: maxDailyHours from config.json
    let config = await storage.getConfig()
    let maxDailyHours = Number(config.maxDailyHours)

    // total hours already assigned for this date
    let todaysShifts = await storage.getEmployeeShiftsOnDate(empId, shift.date)

    let totalHours = 0
    for (let s of todaysShifts) {
        totalHours = totalHours + computeShiftDuration(s.startTime, s.endTime)
    }

    let newHours = computeShiftDuration(shift.startTime, shift.endTime)

    if (totalHours + newHours > maxDailyHours) {
        return "Cannot assign shift: daily hours limit exceeded"
    }

    // add empId,shiftId into the bridge
    await storage.addAssignment(empId, shiftId)
    return "Ok"
}

module.exports = {
    getAllEmployees,
    addEmployeeRecord,
    getEmployeeShifts,
    assignShift,
    computeShiftDuration
}
