import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import index from './routes/index.js'
import gallery from './routes/gallery.js'
import oneGallery from './routes/one_gallery.js'
import resizeImage from './routes/resize_Image.js'
import workWithData from './services/galleryServices.js'
const app = express()

app.set('view engine', 'ejs')
app.set('views', new URL('./views', import.meta.url).pathname)
app.set('layout', 'layouts/layout')

app.use(express.json())
app.use(expressLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.use(workWithData.conditionalBodyParser)
app.use('/', index)
app.use('/', gallery)
app.use('/', oneGallery)
app.use('/', resizeImage)

export default app
