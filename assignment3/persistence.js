const { setServers } = require('node:dns/promises')
setServers(["1.1.1.1", "8.8.8.8"])

const mongodb = require('mongodb')

let client = undefined
let db = undefined
let employeesCollection = undefined
let shiftsCollection = undefined
let assignmentsCollection = undefined

/**
 * Connect to the MongoDB database if not already connected.
 * @returns {Promise<void>}
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://60106796_db_user:12345678class@cluster0.bpyrzjd.mongodb.net/')
        await client.connect()
        db = client.db('infs3201_winter2026')
        employeesCollection = db.collection('employees')
        shiftsCollection = db.collection('shifts')
        assignmentsCollection = db.collection('assignments')
        console.log('connected to mongodb')
    }
}

/**
 * Get all employees from the database.
 * @returns {Promise<Array>} list of employee objects
 */
async function getAllEmployees() {
    await connectDatabase()
    let result = await employeesCollection.find({}).toArray()
    return result
}

/**
 * Find a single employee by their employeeId.
 * @param {string} empId - the employee ID to search for
 * @returns {Promise<Object|null>} the employee object or null
 */
async function findEmployee(empId) {
    await connectDatabase()
    let result = await employeesCollection.findOne({ employeeId: empId })
    return result
}

/**
 * Update an employee's name and phone number in the database.
 * @param {string} empId - the employee ID to update
 * @param {string} name - the new name
 * @param {string} phone - the new phone number
 * @returns {Promise<void>}
 */
async function updateEmployee(empId, name, phone) {
    await connectDatabase()
    await employeesCollection.updateOne(
        { employeeId: empId },
        { $set: { name: name, phone: phone } }
    )
}

/**
 * Get all shifts assigned to a specific employee.
 * @param {string} empId - the employee ID
 * @returns {Promise<Array>} list of shift objects
 */
async function getEmployeeShifts(empId) {
    await connectDatabase()
    let assignmentList = await assignmentsCollection.find({ employeeId: empId }).toArray()

    let shiftIds = []
    for (let asn of assignmentList) {
        shiftIds.push(asn.shiftId)
    }

    let shiftDetails = []
    for (let sid of shiftIds) {
        let shift = await shiftsCollection.findOne({ shiftId: sid })
        if (shift) {
            shiftDetails.push(shift)
        }
    }

    return shiftDetails
}

module.exports = {
    getAllEmployees,
    findEmployee,
    updateEmployee,
    getEmployeeShifts
}
