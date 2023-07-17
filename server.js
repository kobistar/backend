const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const app = express()

const indexRouter = require('./routes/index.js')
const gallery = require('./routes/gallery.js')
const one_gallery = require('./routes/one_gallery.js')
const PORT = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.set('layout', 'layouts/layout')

app.use(express.json())
app.use(expressLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))


app.use('/', indexRouter)
app.use('/', gallery)
app.use('/', one_gallery)



app.listen(PORT, () => {
  console.log('Server is running on port 3000')
})