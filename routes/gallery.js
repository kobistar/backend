import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import workWithData from '../services/galleryServices.js'
import validateData from '../services/validate_Data.js'
import gallerySchema from '../schemas/galleryDataSchemas.js'
import dataExistence from '../services/data_existence.js'

const gallery = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//Allows you to view all galleries and information about them
gallery.get('/gallery', (req, res) => {
  try {
    const responseData = validateData.isNumberAndValid(req, res)
      ? workWithData.workWithPagination(req)
      : workWithData.parseData()
    if (validateData.isResponseValid(res, responseData))
      res.status(200).json(responseData)
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', err })
  }
})

gallery.post('/gallery', (req, res) => {
  if (validateData.isDataValid(req, res)) {
    const galleryName = req.body.name
    try {
      const galleryList = workWithData.parseData()
      if (dataExistence.galleryExist(galleryList, galleryName) !== -1) {
        return res
          .status(409)
          .json({ error: 'Gallery with the same name already exists' })
      }

      const imageFolderPath = join(__dirname, '../images', galleryName)
      //save Data to {name}.json
      workWithData.saveData(
        gallerySchema.oneGalleryData(galleryName),
        galleryName
      )

      //creating a directory to store images
      fs.mkdirSync(imageFolderPath, { recursive: true })

      galleryList.galleries.push(gallerySchema.galleryData(galleryName))

      workWithData.saveData(galleryList)

      return res.status(201).json(gallerySchema.galleryData(galleryName))
    } catch (err) {
      return res.status(500).json({ error: 'Internal Server Error', err })
    }
  }
})

//if the request was to delete, the gallery
gallery.delete('/gallery/:gallery', (req, res) => {
  const galleryName = req.params.gallery
  const galleryList = workWithData.parseData()

  const galleryIndex = dataExistence.galleryExist(galleryList, galleryName)
  if (galleryIndex === -1)
    return res.status(404).json({ error: 'Gallery does not exist.' })

  try {
    //Delete gallery from GalleryDB.json
    galleryList.galleries.splice(galleryIndex, 1)
    workWithData.saveData(galleryList)

    //Delete file gallery
    const galleryImagePath = join(
      __dirname,
      '../database',
      galleryName + '.json'
    )
    fs.rmSync(galleryImagePath, { recursive: true })

    //Delete all images saved in gallery directory
    const galleryDirectoryPath = join(__dirname, '../images', galleryName)
    fs.rmSync(galleryDirectoryPath, { recursive: true })

    return res.status(200).json('Gallery was deleted.')
  } catch (err) {
    return res.status(500).json({ error: 'Error when deleting a gallery.' })
  }
})

export default gallery
