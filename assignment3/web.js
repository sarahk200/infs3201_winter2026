const express = require('express')

const exphbs =  require('express-handlebars')

const business = require('./business')


const app = express()

app.engine('handlebars', exphbs.engine({defaultLayout: false}))
app.set('view engine', 'handlebars')
app.set('views', './templates')

/**
 *Landing page which shows list of all employees with links to their detail pages.
