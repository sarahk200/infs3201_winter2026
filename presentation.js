const prompt = require('prompt-sync')()
const logic = require('./logic')

/**
 * A function to interact with the user and display the results of the
 * employee schedule in a CSV like format.
 */
async function getEmployeeSchedule() {
    let empId = prompt('Enter employee ID: ')
    let details = await logic.getEmployeeShifts(empId)
    console.log('\n')
    console.log('date,start,end')
    for (let d of details) {
        console.log(`${d.date},${d.startTime},${d.endTime}`)
    }
}

/**
 * Display the employee list in a nicely formatted table.
 */
async function displayEmployees() {
    let employees = await logic.getAllEmployees()
    console.log('Employee ID  Name                Phone')
    console.log('-----------  ------------------- ---------')
    for (let emp of employees) {
        console.log(`${emp.employeeId.padEnd(13)}${emp.name.padEnd(20)}${emp.phone}`)
    }
}

/**
 * The UI function for adding a new employee to the system.
 */
async function addNewEmployee() {
    let name = prompt('Enter employee name: ')
    let phone = prompt('Enter phone number: ')
    await logic.addEmployeeRecord({
        name: name,
        phone: phone
    })
    console.log('Employee added...')
}

/**
 * The UI function for assigning an employee to a shift.
 */
async function scheduleEmployee() {
    let empId = prompt('Enter employee ID: ')
    let shiftId = prompt(' Enter shift ID: ')
    let result = await logic.assignShift(empId, shiftId)
    if (result === 'Ok') {
        console.log("Shift Recorded")
    }
    else {
        console.log(result)
    }
}

/**
 * The UI function for displaying the menu and calling the various UI functions.
 */
async function displayMenu() {
    while (true) {
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let choice = Number(prompt("What is your choice> "))
        if (choice === 1) {
            await displayEmployees()
            console.log('\n\n')
        }
        else if (choice == 2) {
            await addNewEmployee()
            console.log('\n\n')
        }
        else if (choice == 3) {
            await scheduleEmployee()
            console.log('\n\n')
        }
        else if (choice == 4) {
            await getEmployeeSchedule()
            console.log('\n\n')
        }
        else if (choice == 5) {
            break
        }
        else {
            console.log("Error in selection")
        }
    }
    console.log('*** Goodbye!')
}

displayMenu()
