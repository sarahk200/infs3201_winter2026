const { setServers } = require('node:dns/promises')
setServers(["1.1.1.1", "8.8.8.8"])

const mongodb = require('mongodb')

let client = undefined
let db = undefined
let employeesCollection = undefined
let shiftsCollection = undefined
let usersCollection = undefined
let sessionCollection = undefined
let securityLogCollection = undefined

/**
 *Connect to the MongoDB database if not already connected.
 *@returns {Promise<void>}
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://60106796_db_user:12345678class@cluster0.bpyrzjd.mongodb.net/')
        await client.connect()
        db = client.db('infs3201_winter2026')
        employeesCollection = db.collection('employees')
        shiftsCollection = db.collection('shifts')
        usersCollection = db.collection('users')
        sessionCollection = db.collection('sessions')
        securityLogCollection = db.collection('security_log')
        console.log('connected to mongodb')
    }
}

/**
 *Get all employees from the database.
 *@returns {Promise<Array>} list of employee objects
 */
async function getAllEmployees() {
    await connectDatabase()
    let result = await employeesCollection.find({}).toArray()
    return result
}

/**
 *Find a single employee by their ObjectId.
 *@param {string} empId - the ObjectId string of the employee
 *@returns {Promise<Object|null>} the employee object or null
 */
async function findEmployee(empId) {
    await connectDatabase()
    let empObjectId = new mongodb.ObjectId(empId)
    let result = await employeesCollection.findOne({ _id: empObjectId })
    return result
}

/**
 *Update an employee's name and phone number.
 *@param {string} empId  ObjectId string of the employee
 *@param {string} name new name
 *@param {string} phone new phone number
 *@returns {Promise<void>}
 */
async function updateEmployee(empId, name, phone) {
    await connectDatabase()
    let empObjectId = new mongodb.ObjectId(empId)
    await employeesCollection.updateOne(
        { _id: empObjectId },
        { $set: { name: name, phone: phone } }
    )
}

/**
 *Get all shifts that contain the employee's ObjectId in their employees array.
 *@param {string} empId ObjectId string of the employee
 *@returns {Promise<Array>} list of shift objects
 */
async function getEmployeeShifts(empId) {
    await connectDatabase()
    let empObjectId = new mongodb.ObjectId(empId)
    let result = await shiftsCollection.find({ employees: empObjectId }).toArray()
    return result
}

/**
 *Find a user by username for login.
 *@param {string} username username to look up
 *@returns {Promise<Object|null>} user object or null
 */
async function findUser(username) {
    await connectDatabase()
    let result = await usersCollection.findOne({ username: username })
    return result
}

/**
 *Save a new session to the database.
 *@param {string} sessionKey - the UUID session key
 *@param {Date} expiry expiry date
 *@param {Object} data session data to store
 *@returns {Promise<void>}
 */
async function saveSession(sessionKey, expiry, data) {
    await connectDatabase()
    await sessionCollection.insertOne({ sessionKey: sessionKey, expiry: expiry, data: data })
}

/**
 *Get a session by its key.
 *@param {string} sessionKey session key to look up
 * @returns {Promise<Object|null>}  session object or null
 */
async function getSession(sessionKey) {
    await connectDatabase()
    let result = await sessionCollection.findOne({ sessionKey: sessionKey })
    return result
}

/**
 *Delete a session by its key.
 *@param {string} sessionKey session key to delete
 *@returns {Promise<void>}
 */
async function deleteSession(sessionKey) {
    await connectDatabase()
    await sessionCollection.deleteOne({ sessionKey: sessionKey })
}

/**
 *Update the expiry time of an existing session.
 *@param {string} sessionKey  session key to update
 *@param {Date} newExpiry  new expiry date
 *@returns {Promise<void>}
 */
async function updateSessionExpiry(sessionKey, newExpiry) {
    await connectDatabase()
    await sessionCollection.updateOne(
        { sessionKey: sessionKey },
        { $set: { expiry: newExpiry } }
    )
}

/**
 *Add an entry to the security log collection.
 *@param {string} username  username if known, or 'unknown'
 *@param {string} url URL that was accessed
 *@param {string} method the HTTP method used
 *@returns {Promise<void>}
 */
async function addSecurityLog(username, url, method) {
    await connectDatabase()
    await securityLogCollection.insertOne({
        timestamp: new Date(),
        username: username,
        url: url,
        method: method
    })
}

/**
 *Update an employee's photo filename
 *@param {string} empId ObjectId string of the employee
 *@param {string} filename the uploaded photo filename
 *@returns {Promise<void>}
 */
async function updateEmployeePhoto(empId, filename) {
    await connectDatabase()
    let empObjectId = new mongodb.ObjectId(empId)
    await employeesCollection.updateOne(
        { _id: empObjectId },
        { $set: { photo: filename } }
    )
}

module.exports = {
    getAllEmployees,
    findEmployee,
    updateEmployee,
    updateEmployeePhoto,
    getEmployeeShifts,
    findUser,
    saveSession,
    getSession,
    deleteSession,
    updateSessionExpiry,
    addSecurityLog
}
