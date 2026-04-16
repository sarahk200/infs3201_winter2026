const { setServers } = require('node:dns/promises')
setServers(["1.1.1.1", "8.8.8.8"])

const mongodb = require('mongodb')

let client = undefined
let db = undefined

/**
 *Connect to the MongoDB database.
 *@returns {Promise<void>}
 */
async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://60106796_db_user:12345678class@cluster0.bpyrzjd.mongodb.net/')
        await client.connect()
        db = client.db('infs3201_winter2026')
        console.log('connected to mongodb')
    }
}

/**
 * Step 1 - Add empty employees array to each shift document.
 * @returns {Promise<void>}
 */
async function addEmptyEmployeesArray() {
    await connectDatabase()
    let shifts = db.collection('shifts')
    await shifts.updateMany({}, { $set: { employees: [] } })
    console.log('Step 1 done - added empty employees array to all shifts')
}

/**
 * Step 2 - Go through assignments and embed employee ObjectIds into shift employees array.
 * @returns {Promise<void>}
 */
async function embedEmployeesInShifts() {
    await connectDatabase()
    let assignments = db.collection('assignments')
    let shifts = db.collection('shifts')
    let employees = db.collection('employees')

    let allAssignments = await assignments.find({}).toArray()

    for (let asn of allAssignments) {
        // find the employee by their old employeeId field
        let employee = await employees.findOne({ employeeId: asn.employeeId })
        if (!employee) {
            console.log('could not find employee: ' + asn.employeeId)
            continue
        }

        // find the shift by old shiftId field
        let shift = await shifts.findOne({ shiftId: asn.shiftId })
        if (!shift) {
            console.log('could not find shift: ' + asn.shiftId)
            continue
        }

        // push the employee ObjectId into the shift's employees array
        await shifts.updateOne(
            { _id: shift._id },
            { $push: { employees: employee._id } }
        )
        console.log('embedded employee ' + asn.employeeId + ' into shift ' + asn.shiftId)
    }

    console.log('Step 2 done - embedded all employees into shifts')
}

/**
 * Step 3 - Remove employeeId from employees, shiftId from shifts, and drop assignments collection.
 * @returns {Promise<void>}
 */
async function removeOldFields() {
    await connectDatabase()
    let shifts = db.collection('shifts')
    let employees = db.collection('employees')

    // remove employeeId from all employees
    await employees.updateMany({}, { $unset: { employeeId: "" } })
    console.log('removed employeeId from employees collection')

    // remove shiftId from all shifts
    await shifts.updateMany({}, { $unset: { shiftId: "" } })
    console.log('removed shiftId from shifts collection')

    // drop the assignments collection completely
    await db.collection('assignments').drop()
    console.log('dropped assignments collection')

    console.log('Step 3 done - removed old fields and assignments collection')
}

/**
 * Run all transformation steps in order.
 * @returns {Promise<void>}
 */
async function runTransformation() {
    try {
        await addEmptyEmployeesArray()
        await embedEmployeesInShifts()
        await removeOldFields()
        console.log('All transformation steps complete!')
    } catch (err) {
        console.log('Error during transformation: ' + err)
    } finally {
        if (client) {
            await client.close()
        }
    }
}

runTransformation()

/*
Shell commands used as alternative for Step 3 if needed:
db.employees.updateMany({}, { $unset: { employeeId: "" } })
db.shifts.updateMany({}, { $unset: { shiftId: "" } })
db.assignments.drop()
*/
