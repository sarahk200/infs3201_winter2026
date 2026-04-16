const express = require('express')

const exphbs =  require('express-handlebars')

const business = require('./business')


const app = express()

app.engine('handlebars', exphbs.engine({defaultLayout: false}))
app.set('view engine', 'handlebars')
app.set('views', './templates')

/**
*Landing page which shows list of all employees with links to their detail pages.
*@param {Object} req express request object
*@param {Object} res express response object
*/

app.get('/', async (req, res) => {
    let employees = await business.getAllEmployees()
    res.render('landing', { employees: employees })
})

/**
 *Employee details page shows employee info and their sorted shifts.
 *@param {Object} req express request object
 *@param {Object} res express response object
 */
app.get('/employee/:empId', async (req, res) => {
    let empId = req.params.empId
    let employee = await business.getEmployee(empId)
    if (!employee) {
        res.send('Employee not found')
        return
    }
    let shifts = await business.getEmployeeShifts(empId)

    // add a flag to each shift if it starts before 12:00
    for (let shift of shifts) {
        let hour = Number(shift.startTime.split(':')[0])
        if (hour < 12) {
            shift.isMorning = true
        }
    }
    res.render('employee', { employee: employee, shifts: shifts })
})

/**
*Edit employee page shows prefilled form with current employee details.
*@param {Object} req express request object
*@param {Object} res express response object
*/
app.get('/edit/:empId', async (req, res) => {
    let empId = req.params.empId
    let employee = await business.getEmployee(empId)
    if (!employee){
        res.send('Employee not found')
        return
    }
    res.render('edit',{ employee: employee })
})

/**
*Handle edit form submission validates input and updates employee in database
*@param {Object} req express request object
*@param {Object} res express response object
*/
app.post('/edit/:empId', async (req, res) => {
    let empId = req.params.empId
    let name = req.body.name
    let phone = req.body.phone
    let result = await business.updateEmployee(empId, name, phone)
    if (result !== 'ok') {
        res.send(result)
        return
    }
    res.redirect('/')
})

app.listen(8000, ()=>{console.log('Server running on http://localhost:8000')})


