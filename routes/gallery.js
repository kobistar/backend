const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const Ajv = require('ajv')
const gallerySchema = require('../schemas/gallerySchema.js')
const dataParser = require('../services/galleryServices.js')

const ajv = new Ajv()

//Allows you to view all galleries and information about them
router.get('/gallery', (req, res) => {
  try {
    const validateResponse = ajv.compile(gallerySchema.galleryGetSchema)
    const responseData = dataParser.parseData()
    const isValid = validateResponse(responseData)
    if (!isValid) {
      return res.status(500).json(validateResponse.errors)
    }

    res.status(200).json(responseData)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.post('/gallery', (req, res) => {
  if (!isContentTypeJson(req)) {
    return res.status(500).json({ error: 'Invalid JSON format.' })
  }
  const validateGallery = ajv.compile(gallerySchema.galleryPostSchema)
  const galleryName = req.body.name
  const isValid = validateGallery(req.body)
  if (!isValid) {
    const errors = validateGallery.errors
    return res.status(400).json({
      error: "Invalid request. The request doesn't conform to the schema.",
      errors,
    })
  }

  checkSlashPresence(res, galleryName) //if galleryName contain slash

  const galleryDataWithOutImage = {
    path: replaceSpaceWithPercent(galleryName),
    name: galleryName,
  }

  try {
    const galleryList = dataParser.parseData()

    const galleryExist = galleryList.galleries.find(
      (gallery) => gallery.name === galleryName
    )
    if (galleryExist) {
      return res
        .status(409)
        .json({ error: 'Gallery with the same name already exists' })
    }

    const databasePath = path.join(
      __dirname,
      '../database/',
      galleryName + '.json'
    )
    const imageFolderPath = path.join(__dirname, '../images', galleryName)
    /*const titlePhotoFolderPath = path.join(
      __dirname,
      '../images/titlePhoto',
      galleryName
    )*/

    const data = {
      gallery: galleryDataWithOutImage,
      images: [],
    }

    fs.writeFileSync(databasePath, JSON.stringify(data), 'utf-8')
    fs.mkdirSync(imageFolderPath, { recursive: true })
   // fs.mkdirSync(titlePhotoFolderPath, { recursive: true })

    galleryList.galleries.push(galleryDataWithOutImage)

    const updatedData = JSON.stringify(galleryList)
    dataParser.saveData(updatedData)

    return res
      .status(201)
      .json({ path: replaceSpaceWithPercent(galleryName), name: galleryName })
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', err })
  }
})

function checkSlashPresence(res, name) {
  if (name.includes('/'))
    return res.status(400).json({ error: 'Name can not contain slash.' })
}

function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) name = name.replace(/ /g, '%20')

  return name
}

function isContentTypeJson(dataHeader) {
  const contentType = dataHeader.headers['content-type']
  return contentType.toLowerCase().startsWith('application/json') ? true : false
}

module.exports = router
