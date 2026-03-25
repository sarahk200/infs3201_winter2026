const express = require('express')
const exphbs = require('express-handlebars')
const business = require('./business')

const app = express()

app.use(express.urlencoded({ extended: false }))

app.engine('handlebars', exphbs.engine({ defaultLayout: false }))
app.set('view engine', 'handlebars')
app.set('views', './templates')

/**
 * Security logging middleware - logs every request to the security_log collection.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - next middleware function
 */
app.use(async (req, res, next) => {
    let username = 'unknown'
    let sessionKey = req.headers.cookie
    if (sessionKey) {
        sessionKey = sessionKey.replace('sessionkey=', '')
        let sessionData = await business.getSession(sessionKey)
        if (sessionData) {
            username = sessionData.username
        }
    }
    await business.logAccess(username, req.url, req.method)
    next()
})

/**
 * Auth middleware - checks session and redirects to login if not authenticated.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - next middleware function
 */
async function checkAuth(req, res, next) {
    let sessionKey = req.headers.cookie
    if (!sessionKey) {
        res.redirect('/login?message=Please log in first')
        return
    }
    sessionKey = sessionKey.replace('sessionkey=', '')
    let sessionData = await business.getSession(sessionKey)
    if (!sessionData) {
        res.redirect('/login?message=Session expired, please log in again')
        return
    }
    req.username = sessionData.username
    next()
}

/**
 * Login page - shows login form with optional message.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/login', (req, res) => {
    let message = req.query.message || ''
    res.render('login', { message: message })
})

/**
 * Handle login form submission.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.post('/login', async (req, res) => {
    let username = req.body.username
    let password = req.body.password

    let result = await business.checkLogin(username, password)
    if (!result) {
        res.redirect('/login?message=Invalid username or password')
        return
    }

    let sessionKey = await business.startSession(username)
    res.setHeader('Set-Cookie', `sessionkey=${sessionKey}; HttpOnly`)
    res.redirect('/')
})

/**
 * Logout - clears cookie and deletes session.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/logout', async (req, res) => {
    let sessionKey = req.headers.cookie
    if (sessionKey) {
        sessionKey = sessionKey.replace('sessionkey=', '')
        await business.deleteSession(sessionKey)
    }
    res.setHeader('Set-Cookie', 'sessionkey=; Max-Age=0')
    res.redirect('/login?message=You have been logged out')
})

/**
 * Landing page - shows list of all employees.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/', checkAuth, async (req, res) => {
    let employees = await business.getAllEmployees()
    res.render('landing', { employees: employees })
})

/**
 * Employee details page - shows employee info and their sorted shifts.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/employee/:empId', checkAuth, async (req, res) => {
    let empId = req.params.empId
    let employee = await business.getEmployee(empId)
    if (!employee) {
        res.send('Employee not found')
        return
    }
    let shifts = await business.getEmployeeShifts(empId)

    for (let shift of shifts) {
        let hour = Number(shift.startTime.split(':')[0])
        if (hour < 12) {
            shift.isMorning = true
        }
    }

    res.render('employee', { employee: employee, shifts: shifts })
})

/**
 * Edit employee page - shows prefilled form.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/edit/:empId', checkAuth, async (req, res) => {
    let empId = req.params.empId
    let employee = await business.getEmployee(empId)
    if (!employee) {
        res.send('Employee not found')
        return
    }
    res.render('edit', { employee: employee })
})

/**
 * Handle edit form submission - validates and updates employee.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.post('/edit/:empId', checkAuth, async (req, res) => {
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

app.listen(8000, () => {
    console.log('Server running on http://localhost:8000')
})
