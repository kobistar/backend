import express from 'express'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { dirname, join } from 'path'
import fs from 'fs'
//import bodyParser from 'body-parser'
import dataExistence from '../services/data_existence.js'
import workWithData from '../services/galleryServices.js'
import validateData from '../services/validate_Data.js'
import gallerySchema from '../schemas/galleryDataSchemas.js'

const oneGallery = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//Defines a configuration for saving uploaded files to disk,
//where the path to the destination folder and the filename
//are derived from the request parameters and the original filename.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, join(__dirname, '../images/', req.params.gallery))
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
      workWithData.parseData(),
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
oneGallery.get('/gallery/:gallery', (req, res) => {
  const galleryName = req.params.gallery
  try {
    //Checks whether the gallery exists
    if (
      dataExistence.galleryExist(workWithData.parseData(), galleryName) === -1
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
oneGallery.post('/gallery/:gallery', upload.single('image'), (req, res) => {
  if (validateData.isUploadFileValid(req, res)) {
    const galleryName = req.params.gallery
    const imageName = req.file.originalname

    try {
      let galleryList = workWithData.parseData()
      const galleryIndex = dataExistence.galleryExist(galleryList, galleryName)
      const gallery = galleryList.galleries[galleryIndex]

      //if gallery has no title photo, first upload photo will be in titlePhoto
      if (!gallery.image) {
        gallery.image = gallerySchema.imageData(imageName, galleryName)
        workWithData.saveData(galleryList)
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
oneGallery.delete('/gallery/:gallery/:image', (req, res) => {
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
      fs.unlinkSync(join(__dirname, '../images', galleryName, imageName))

      //delete information about titlePhoto if exist
      const galleriesList = workWithData.parseData()
      if (
        validateData.isTitlePhotoExist(galleriesList, galleryName, imageName)
      ) {
        const galleryIndex = dataExistence.galleryExist(
          galleriesList,
          galleryName
        )

        if (galleryIndex !== -1) {
          delete galleriesList.galleries[galleryIndex].image
          workWithData.saveData(galleriesList)
        }
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error working with a file.', err })
    }

    return res.status(200).json('Image was deleted.')
  }
})

export default oneGallery
