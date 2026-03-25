const persistence = require('./persistence')
const crypto = require('crypto')

/**
 *Get all employees from persistence layer
 *@returns list of employees
 */
async function getAllEmployees() {
    let employees = await persistence.getAllEmployees()
    return employees
}

/**
 *Get one employee by their ObjectId string
 *@param {string} empId - the ObjectId string
 *@returns {Promise<Object|null>} employee object or null
 */
async function getEmployee(empId) {
    let employee = await persistence.findEmployee(empId)
    return employee
}

/**
 *Update employee details after validating inputs
 *@param {string} empId the ObjectId string of the employee
 *@param {string} name new name
 *@param {string} phone new phone number
 *@returns {Promise<string>} 'ok' or error message
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
 *Get all shifts for an employee sorted by date and start time
 *@param {string} empId - the ObjectId string of the employee
 *@returns {Promise<Array>} sorted list of shift objects
 */
async function getEmployeeShifts(empId) {
    let shifts = await persistence.getEmployeeShifts(empId)

    for (let i = 0; i < shifts.length - 1; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            let a = shifts[i]
            let b = shifts[j]
            let aKey = a.date + a.startTime
            let bKey = b.date + b.startTime
            if (aKey > bKey) {
                let temp = shifts[i]
                shifts[i] = shifts[j]
                shifts[j] = temp
            }
        }
    }

    return shifts
}

/**
 *Hash a password using SHA256
 *@param {string} password plain text password
 *@returns {string} the hashed password
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 *Check login credentials and return username if valid
 *@param {string} username the username entered
 *@param {string} password the plain text password entered
 *@returns {Promise<string|undefined>} username if valid, undefined if not
 */
async function checkLogin(username, password) {
    let user = await persistence.findUser(username)
    if (!user) {
        return undefined
    }
    let hashed = hashPassword(password)
    if (user.password !== hashed) {
        return undefined
    }
    return user.username
}

/**
 *Start a new session for the given username
 *@param {string} username the logged in username
 *@returns {Promise<string>} the session key UUID
 */
async function startSession(username) {
    let sessionKey = crypto.randomUUID()
    let expiry = new Date(Date.now() + 5 * 60 * 1000)
    await persistence.saveSession(sessionKey, expiry, { username: username })
    return sessionKey
}

/**
 *Get session data if the session is still valid (not expired)
 *@param {string} sessionKey the session key from the cookie
 *@returns {Promise<Object|null>} session data or null if expired/not found
 */
async function getSession(sessionKey) {
    let session = await persistence.getSession(sessionKey)
    if (!session) {
        return null
    }
    if (new Date() > session.expiry) {
        await persistence.deleteSession(sessionKey)
        return null
    }
    // extend the session by another 5 minutes
    let newExpiry = new Date(Date.now() + 5 * 60 * 1000)
    await persistence.updateSessionExpiry(sessionKey, newExpiry)
    return session.data
}

/**
 *Delete a session (logout)
 *@param {string} sessionKey - the session key to delete
 *@returns {Promise<void>}
 */
async function deleteSession(sessionKey) {
    await persistence.deleteSession(sessionKey)
}

/**
 *Log a security event
 *@param {string} username the username or 'unknown'
 *@param {string} url the URL accessed
 *@param {string} method the HTTP method
 *@returns {Promise<void>}
 */
async function logAccess(username, url, method) {
    await persistence.addSecurityLog(username, url, method)
}

module.exports = {
    getAllEmployees,
    getEmployee,
    updateEmployee,
    getEmployeeShifts,
    checkLogin,
    startSession,
    getSession,
    deleteSession,
    logAccess
}
