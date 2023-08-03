const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const dataExistence = require('../services/data_existence.js')
const workWithData = require('../services/galleryServices.js')
const validateData = require('../services/validate_Data.js')
const gallerySchema = require('../schemas/galleryDataSchemas.js')

//Defines a configuration for saving uploaded files to disk,
//where the path to the destination folder and the filename
//are derived from the request parameters and the original filename.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/', req.params.gallery))
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
})

//Allows you to upload files to the server and filter them by allowed types.
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg']
    if (!file) {
      req.fileFilterError = gallerySchema.fileErrorSchema(
        'No file uploaded',
        'NO_FILE'
      )
      return cb(null, false)
    }

    if (
      !allowedTypes.includes(file.mimetype) ||
      !file.originalname.includes('.jpeg')
    ) {
      req.fileFilterError = gallerySchema.fileErrorSchema(
        'Only JPEG files are allowed',
        'UNSUPPORTED_MEDIA_TYPE'
      )

      return cb(null, false)
    }

    const galleryIndex = dataExistence.galleryExist(
      workWithData.parseData('GalleryDB'),
      req.params.gallery
    )
    if (galleryIndex === -1) {
      req.fileFilterError = gallerySchema.fileErrorSchema(
        "Gallery doesn't exist.",
        'GALLERY_NOT_FOUND'
      )
      return cb(null, false)
    }

    cb(null, true)
  },
})

//The contents of a specific gallery will be displayed with information about all photos
router.get('/gallery/:gallery', (req, res) => {
  const galleryName = req.params.gallery
  try {
    //Checks whether the gallery exists
    if (
      dataExistence.galleryExist(
        workWithData.parseData('GalleryDB'),
        galleryName
      ) === -1
    )
      return res.status(404).json({ error: 'Gallery does not exist' })

    const responseData = workWithData.parseData(galleryName)
    const isValid = validateData.isOneGalleryResponseValid(res, responseData)

    if (isValid)
      //if the gallery database exists, the oneGalleryList function is called, which will contain information about the gallery
      return res.status(200).json(responseData)
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', err })
  }
})

//Adding a new photo to the gallery
router.post('/gallery/:gallery', upload.single('image'), (req, res) => {
  if (validateData.isUploadFileValid(req, res)) {
    const galleryName = req.params.gallery
    const imageName = req.file.originalname

    try {
      let galleryList = workWithData.parseData('GalleryDB')
      const galleryIndex = dataExistence.galleryExist(galleryList, galleryName)
      const gallery = galleryList.galleries[galleryIndex]

      //if gallery has no title photo, first upload photo will be in titlePhoto
      if (!gallery.image) {
        gallery.image = gallerySchema.imageData(imageName, galleryName)
        workWithData.saveData(galleryList, 'GalleryDB')
      }

      let oneGalleryList = workWithData.parseData(galleryName)
      oneGalleryList.images.push(
        gallerySchema.imageData(imageName, galleryName)
      )

      workWithData.saveData(oneGalleryList, galleryName)

      res.status(201).json(gallerySchema.response(imageName, galleryName))
    } catch (err) {
      return res
        .status(500)
        .json({ error: 'Error processing the request.', err })
    }
  }
})

//if the request was to delete the image
router.delete('/gallery/:gallery/:image', (req, res) => {
  const galleryName = req.params.gallery
  const imageName = req.params.image

  if (validateData.isDeleteImageValid(req, res)) {
    try {
      const galleryList = workWithData.parseData(galleryName)
      const index = dataExistence.imageExist(galleryList, imageName)

      //Delete information about photo from {name}.json
      galleryList.images.splice(index, 1)
      workWithData.saveData(galleryList, galleryName)

      //Delete image as file
      fs.unlinkSync(path.join(__dirname, '../images', galleryName, imageName))

      //delete information about titlePhoto if exist
      const galleriesList = workWithData.parseData('GalleryDB')
      const galleryIndex = dataExistence.galleryExist(
        galleriesList,
        galleryName
      )
      const imageIndex = dataExistence.titlePhotoExist(galleriesList, imageName)
      if (imageIndex !== -1 && galleryIndex !== -1) {
        delete galleriesList.galleries[galleryIndex].image
        workWithData.saveData(galleriesList, 'GalleryDB')
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error working with a file.', err })
    }

    return res.status(200).json({ error: 'Image was deleted.' })
  }
})

module.exports = router
