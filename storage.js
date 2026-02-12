const fs = require('fs/promises')

async function getConfig() {
    let rawData = await fs.readFile('config.json')
    return JSON.parse(rawData)
}

async function getAllEmployees() {
    let rawData = await fs.readFile('employees.json')
    result = JSON.parse(rawData)
    return result
}

async function findEmployee(empId) {
    let rawData = await fs.readFile('employees.json')
    employeeList = JSON.parse(rawData)
    for (let emp of employeeList) {
        if (emp.employeeId === empId) {
            return emp
        }
    }
    return undefined
}

async function findShift(shiftId) {
    let rawData = await fs.readFile('shifts.json')
    shiftList = JSON.parse(rawData)
    for (let shift of shiftList) {
        if (shift.shiftId == shiftId) {
            return shift
        }
    }
    return undefined
}

async function getEmployeeShifts(empId) {
    let rawData = await fs.readFile('assignments.json')
    assignmentList = JSON.parse(rawData)
    let shiftIds = []
    for (let asn of assignmentList) {
        if (asn.employeeId == empId) {
            shiftIds.push(asn.shiftId)
        }
    }

    rawData = await fs.readFile('shifts.json')
    shiftList = JSON.parse(rawData)
    let shiftDetails = []
    for (let sh of shiftList) {
        if (shiftIds.includes(sh.shiftId)) {
            shiftDetails.push(sh)
        }
    }

    return shiftDetails
}

/**
 * NEW helper for the daily-hours limit feature
 */
async function getEmployeeShiftsOnDate(empId, date) {
    let all = await getEmployeeShifts(empId)
    let result = []
    for (let s of all) {
        if (s.date === date) {
            result.push(s)
        }
    }
    return result
}

async function findAssignment(empId, shiftId) {
    let rawData = await fs.readFile('assignments.json')
    assignmentList = JSON.parse(rawData)
    for (let asn of assignmentList) {
        if (asn.employeeId === empId && asn.shiftId === shiftId) {
            return asn
        }
    }
    return undefined
}

async function addAssignment(empId, shiftId) {
    let rawData = await fs.readFile('assignments.json')
    assignmentList = JSON.parse(rawData)
    assignmentList.push({employeeId: empId, shiftId: shiftId})
    await fs.writeFile('assignments.json', JSON.stringify(assignmentList, null, 4))
}

async function addEmployeeRecord(emp) {
    let maxId = 0
    let rawData = await fs.readFile('employees.json')
    let employeeList = JSON.parse(rawData)
    for (let e of employeeList) {
        let eid = Number(e.employeeId.slice(1))
        if (eid > maxId) {
            maxId = eid
        }
    }
    emp.employeeId = `E${String(maxId+1).padStart(3,'0')}`
    employeeList.push(emp)
    await fs.writeFile('employees.json', JSON.stringify(employeeList, null, 4))
}

module.exports = {
    getConfig,
    getAllEmployees,
    findEmployee,
    findShift,
    getEmployeeShifts,
    getEmployeeShiftsOnDate,
    findAssignment,
    addAssignment,
    addEmployeeRecord
}
