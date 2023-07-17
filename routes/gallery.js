const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const dataParser = require('../services/galleryServices.js')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/titlePhoto'))
  },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'] 
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Only JPEG and PNG files are allowed')
      error.code = 'UNSUPPORTED_MEDIA_TYPE'
      return cb(error, false)
    }
    cb(null, true)
  }
})


router.get('/gallery', (req, res) => {
  dataParser.parseData((err, galleryList) => {
    if (err) return res.status(500).render('../views/partials/back.ejs', { Message: 'Internal Server Error' })

    res.status(200).render('../views/galleries/galleries.ejs', { galleryList : galleryList })
  })
})


router.post('/gallery', upload.single('galleryImage'),(req, res) => {
  const expectedImageStructure = ["path", "fullpath", "name", "modified"]
  const expectedStructureWithImage = ["path", "name", "image"]
  const expectedStructureWithOutImage = ["path","name"]
  const galleryName = req.body.galleryName
  
  const errorSchema = {
    code: 400,
    playload: {
      paths: galleryName,
      validator: "required",
      example: null
    },
    name: "INVALID_SCHEMA",
    description: "Bad JSON object: u'name' is a required property"
  } 

  if(checkNameValidity(galleryName)) return res.status(400).render('../views/partials/back.ejs', { Message: "Name must be a string."})

  if (checkSlashPresence(galleryName)) return res.status(400).render('../views/partials/back.ejs', { Message: "Name can not contain slash."})
  
  const galleryDataWithOutImage = {
    path: replaceSpaceWithPercent(galleryName),
    name: galleryName
  }

  let galleryDataWithImage = null
  if (req.file) {
    galleryDataWithImage = {
      path: replaceSpaceWithPercent(galleryName),
      name: galleryName,
      image: {
        path: replaceSpaceWithPercent(req.file.originalname),
        fullpath: path.join(__dirname, '../images/titlePhoto', replaceSpaceWithPercent(req.file.originalname)),
        name: req.file.filename,
        modified: new Date().toISOString()
      }
    }
  }

  dataParser.parseData((err, galleryList) => {
    if (err) return res.status(500).render('../views/partials/back.ejs', { Message: 'Internal Server Error'})
    
    const existingGallery = galleryList.galleries.find(gallery => gallery.name === galleryName)
    
    if (existingGallery) { 
      return res.status(409).render('../views/partials/back.ejs', { Message: 'Gallery with the same name already exists' })
    }

    const jsonPath = path.join(__dirname, '../database/', galleryName + '.json')
    const imagePath = path.join(__dirname, "../images", galleryName)

    const data = {
      gallery: galleryDataWithOutImage,
      images: []
    }
    
    
    fs.mkdir(imagePath, { recursive: true }, (err) => {
      if (err)console.error('Error creating a folder:', err) 
    })

    fs.writeFile(jsonPath, JSON.stringify(data), 'utf-8', (err) => {
      if (err) console.error('Error creating a file:', err) 
  
})

    if(req.file){
      const isStructureValid = deepEqual(Object.keys(galleryDataWithImage), expectedStructureWithImage)
      const isStructureImageValid = deepEqual(Object.keys(galleryDataWithImage.image), expectedImageStructure)
      
      if (!isStructureValid || !isStructureImageValid) return res.status(400).render('../views/partials/error.ejs', { Message: "Invalid request. The request doesn't conform to the schema.", errorSchema: errorSchema })

      galleryList.galleries.push(galleryDataWithImage)
    }
    else{ 
      const isStructureValid = deepEqual(Object.keys(galleryDataWithOutImage), expectedStructureWithOutImage)

      if (!isStructureValid) return res.status(400).render('../views/partials/error.ejs', { Message: "Invalid request. The request doesn't conform to the schema.", errorSchema: errorSchema })

      galleryList.galleries.push(galleryDataWithOutImage) 
    }
    

    const updatedData = JSON.stringify(galleryList)
    dataParser.saveData(updatedData, (err) => {
      if (err) return res.status(500).render('../views/partials/back.ejs', { Message: 'Internal Server Error' })
    
      res.status(201).render('../views/partials/back.ejs', { Message: 'Gallery was created' })
    })
    
  })
})



function checkNameValidity(name) {
  if (typeof name !== 'string') return true
    return false
}

function checkSlashPresence(name) {
  if (name.includes('/')) return true  
  return false  
}

function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) name = name.replace(/ /g, '%20')
  
  return name
}

function deepEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++){
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}


module.exports = router


