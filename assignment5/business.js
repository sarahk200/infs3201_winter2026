const persistence = require('./persistence')
const crypto = require('crypto')
const emailSystem = require('./emailSystem')
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

/**
 *Update the photo for an employee
 *@param {string} empId the ObjectId string of the employee
 *@param {string} filename the filename of the uploaded photo
 *@returns {Promise<void>}
 */
async function updateEmployeePhoto(empId, filename) {
    await persistence.updateEmployeePhoto(empId, filename)
}
/**
 *Generate a random 6-digit 2FA code.
 *@returns {string} 6-digit code
 */
function generateTwoFactorCode() {
    let num = Math.floor(Math.random() * 1000000)
    return num.toString().padStart(6, "0")
}

/**
 *Handle a failed login attempt.
 *Sends suspicious email after 3 failures and locks after 10
 *@param {string} username the username that failed login
 *@returns {Promise<{locked:boolean,suspiciousEmail:boolean}>}
 */
async function handleFailedLogin(username) {
    let newCount = await persistence.incrementLoginAttempts(username)

    let result = {
        locked: false,
        suspiciousEmail: false
    }

    let user = await persistence.findUser(username)
    if (!user) {
        return result
    }

    if (newCount === 3) {
        emailSystem.sendSuspiciousActivityEmail(user.email)
        result.suspiciousEmail = true
    }

    if (newCount >= 10) {
        await persistence.lockUserAccount(username)
        emailSystem.sendAccountLockedEmail(user.email)
        result.locked = true
    }

    return result
}

/**
 *check login and setup 2FA
 *@param {string} username the username entered
 *@param {string} password the plain text password entered
 *@returns {Promise<Object>} result object
 */
async function validateLoginAndSetup2FA(username, password) {
    let user = await persistence.findUser(username)

    if (!user) {
        return { success: false, error: "Invalid username or password." }
    }

    if (user.isLocked) {
        return { success: false, error: "This account is locked." }
    }

    let hashed = hashPassword(password)
    if (user.password !== hashed) {
        await handleFailedLogin(username)
        return { success: false, error: "Invalid username or password." }
    }

    let code = generateTwoFactorCode()
    emailSystem.sendTwoFactorCode(user.email, code)

    await persistence.resetLoginAttempts(username)

    return {
        success: true,
        user: user,
        twoFACode: code
    }
}

/**
 *Validate a 2FA code and expiry.
 *@param {string} expectedCode the code that was generated
 *@param {string} submittedCode the code typed by the user
 *@param {number} expiryTime expiry time in milliseconds since epoch
 *@returns {{valid:boolean,error:string}}
 */
function validateTwoFactorCode(expectedCode, submittedCode, expiryTime) {
    if (!expectedCode) {
        return { valid: false, error: "No verification code found." }
    }

    if (Date.now() > expiryTime) {
        return { valid: false, error: "Your code has expired. Please log in again." }
    }

    if (submittedCode !== expectedCode) {
        return { valid: false, error: "Incorrect code. Please try again." }
    }

    return { valid: true, error: "" }
}

/**
 *Validate employee document upload.
 *@param {Object} file multer file object
 *@param {string[]} existingDocs already uploaded filenames
 *@returns {{valid:boolean,error:string}}
 */
function validateDocumentUpload(file, existingDocs) {
    if (!file) {
        return { valid: false, error: "No file was uploaded." }
    }

    if (file.mimetype !== "application/pdf") {
        return { valid: false, error: "Only PDF files are allowed." }
    }

    if (file.size > 2 * 1024 * 1024) {
        return { valid: false, error: "File must not be more than 2MB." }
    }

    if (existingDocs.length >= 5) {
        return { valid: false, error: "This employee already has 5 documents." }
    }

    return { valid: true, error: "" }
}
module.exports = {
    getAllEmployees,
    getEmployee,
    updateEmployee,
    updateEmployeePhoto,
    getEmployeeShifts,
    checkLogin,
    startSession,
    getSession,
    deleteSession,
    logAccess,
    generateTwoFactorCode,
    handleFailedLogin,
    validateLoginAndSetup2FA,
    validateTwoFactorCode,
    validateDocumentUpload
}