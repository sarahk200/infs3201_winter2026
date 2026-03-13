const persistence = require('./persistence')

/**
 *Get all employees from persistence layer.
 *@returns {Promise<Array>} list of all employees
 */
async function getAllEmployees() {
    let employees = await persistence.getAllEmployees()
    return employees
}

/**
 *Get one employee by their ID.
 *@param {string} empId the employee ID
 *@returns {Promise<Object|null>} employee object or null if not found
 */
async function getEmployee(empId) {
    let employee = await persistence.findEmployee(empId)
    return employee
}

/**
 *Update an employee's details after validating the inputs.
 *@param {string} empId the employee ID to update
 *@param {string} name the new name (will be trimmed)
 *@param {string} phone the new phone number (will be trimmed)
 *@returns {Promise<string>} 'ok' if success, error message string if validation fails
 */
async function updateEmployee(empId, name, phone) {
    name = name.trim()
    phone = phone.trim()

    if (name === '') {
        return 'Name cannot be empty'
    }

    let phonePattern = /^\d{4}-\d{4}$/
    if (!phonePattern.test(phone)) {
        return 'Phone number must be in the format 1234-5678'
    }

    await persistence.updateEmployee(empId, name, phone)
    return 'ok'
}

/**
 *Get all shifts for an employee, sorted by date then start time.
 *@param {string} empId - the employee ID
 *@returns {Promise<Array>} sorted list of shift objects
 */
async function getEmployeeShifts(empId) {
    let shifts = await persistence.getEmployeeShifts(empId)

    //sort by date first, then by start time
    for (let i = 0; i<shifts.length-1; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            let a =shifts[i]
            let b =shifts[j]
            let aKey =a.date+a.startTime
            let bKey =b.date+b.startTime
            if (aKey>bKey){
                let temp=shifts[i]
                 shifts[i] =shifts[j]
                shifts[j] =temp
            }
        }
    }

    return shifts
}

module.exports = {
    getAllEmployees,
    getEmployee,
    updateEmployee,
    getEmployeeShifts
}
