import express from 'express'
const index = express.Router()

index.get('/', (req, res) => {
    res.render('index')
})

export default index