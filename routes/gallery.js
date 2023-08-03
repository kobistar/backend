const express = require('express')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const workWithData = require('../services/galleryServices.js')
const validateData = require('../services/validate_Data.js')
const gallerySchema = require('../schemas/galleryDataSchemas.js')
const dataExistence = require('../services/data_existence.js')

//Allows you to view all galleries and information about them
router.get('/gallery', (req, res) => {
  try {
    const responseData = workWithData.parseData('GalleryDB')
    if (validateData.isResponseValid(res, responseData))
      res.status(200).json(responseData)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', err })
  }
})

router.post('/gallery', (req, res) => {
  if (validateData.isDataValid(req, res)) {
    const galleryName = req.body.name

    try {
      const galleryList = workWithData.parseData('GalleryDB')
      if (dataExistence.galleryExist(galleryList, galleryName) !== -1)
        return res
          .status(409)
          .json({ error: 'Gallery with the same name already exists' })

      const imageFolderPath = path.join(__dirname, '../images', galleryName)

      //save Data to {name}.json
      workWithData.saveData(
        gallerySchema.oneGalleryData(galleryName),
        galleryName
      )

      //creating a directory to store images
      fs.mkdirSync(imageFolderPath, { recursive: true })

      galleryList.galleries.push(gallerySchema.galleryData(galleryName))

      //const updatedData = JSON.stringify(galleryList)
      workWithData.saveData(galleryList, 'GalleryDB')

      return res.status(201).json(gallerySchema.galleryData(galleryName))
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error', err })
    }
  }
})

//if the request was to delete, the gallery
router.delete('/gallery/:gallery', (req, res) => {
  const galleryName = req.params.gallery
  const galleryList = workWithData.parseData('GalleryDB')

  const galleryIndex = dataExistence.galleryExist(galleryList, galleryName)
  if (galleryIndex === -1)
    return res.status(404).json({ error: 'Gallery does not exist.' })

  try {
    //Delete gallery from GalleryDB.json
    galleryList.galleries.splice(galleryIndex, 1)
    workWithData.saveData(galleryList, 'GalleryDB')

    //Delete file gallery
    const galleryImagePath = path.join(
      __dirname,
      '../database',
      galleryName + '.json'
    )
    fs.rmSync(galleryImagePath, { recursive: true })

    //Delete all images saved in gallery directory
    const galleryDirectoryPath = path.join(__dirname, '../images', galleryName)
    fs.rmSync(galleryDirectoryPath, { recursive: true })

    return res.status(200).json({ error: 'Gallery was deleted.' })
  } catch (err) {
    return res.status(500).json({ error: 'Error when deleting a gallery.' })
  }
})

module.exports = router
