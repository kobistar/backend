const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const router = express.Router()
const databasePath = path.join(__dirname, '../database/GalleryDB.json')
const Ajv = require('ajv')
const gallerySchema = require('../schemas/gallerySchema.js')
const moment = require('moment')
const ajv = new Ajv()

//Defines a configuration for saving uploaded files to disk,
//where the path to the destination folder and the filename
//are derived from the request parameters and the original filename.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    /*const titlePhotoPath = path.join(
      __dirname,
      '../images/titlePhoto',
      req.params.gallery
    )
    if (fs.readdirSync(titlePhotoPath) == 0) {
      cb(null, titlePhotoPath)
    } else {*/
    cb(null, path.join(__dirname, '../images/', req.params.gallery))
    //}
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
      req.fileFilterError = {
        error: 'No file uploaded',
        code: 'NO_FILE',
      }
      return cb(null, false)
    }

    if (
      !allowedTypes.includes(file.mimetype) ||
      !file.originalname.includes('.jpeg')
    ) {
      req.fileFilterError = {
        error: 'Only JPEG files are allowed',
        code: 'UNSUPPORTED_MEDIA_TYPE',
      }
      return cb(null, false)
    }

    if (!galleryExist(replaceSpaceWithPercent(req.params.gallery))) {
      req.fileFilterError = {
        error: "Gallery doesn't exist.",
        code: 'GALLERY_NOT_FOUND',
      }
      return cb(null, false)
    }

    cb(null, true)
  },
})

//The contents of a specific gallery will be displayed with information about all photos
router.get('/gallery/:path', (req, res) => {
  const galleryName = req.params.path
  try {
    //Checks whether the gallery exists
    if (!galleryExist(replaceSpaceWithPercent(galleryName))) {
      return res.status(404).json({ error: 'Gallery does not exist' })
    }

    const validateResponse = ajv.compile(gallerySchema.oneGalleryGetSchema)
    const responseData = oneGalleryList(galleryName)
    const isValid = validateResponse(responseData)
    if (!isValid) {
      return res.status(500).json(validateResponse.errors)
    }
    //if the gallery database exists, the oneGalleryList function is called, which will contain information about the gallery
    res.status(200).json(responseData)
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', err })
  }
})

//Adding a new photo to the gallery
router.post('/gallery/:gallery', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(500).json({ error: 'The file did not upload.' })
  }
  const galleryName = req.params.gallery

  if (req.fileFilterError) {
    if (req.fileFilterError.code === 'NO_FILE') {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    if (req.fileFilterError.code === 'UNSUPPORTED_MEDIA_TYPE') {
      return res.status(400).json({ error: 'Only JPEG files are allowed' })
    }

    if (req.fileFilterError.code === 'GALLERY_NOT_FOUND') {
      return res.status(404).json({ error: "Gallery doesn't exist" })
    }
  }

  if (req.file.originalname === galleryName) {
    return res
      .status(500)
      .json({ error: 'An image can not have the same name as its gallery.' })
  }

  const galleryPath = path.join(__dirname, '../database', galleryName + '.json')

  const allGalleriesPath = path.join(__dirname, '../database/GalleryDB.json')

  const fullPathToImage = path.join(
    replaceSpaceWithPercent(galleryName),
    replaceSpaceWithPercent(req.file.originalname)
  )
  const imageData = {
    path: replaceSpaceWithPercent(req.file.originalname),
    fullpath: fullPathToImage,
    name: req.file.originalname,
    modified: moment().format(),
  }

  const response = { uploaded: [imageData] }

  try {
    let galleryList = allGalleriesList()
    const galleryIndex = galleryList.galleries.findIndex(
      (gallery) => gallery.path === replaceSpaceWithPercent(galleryName)
    )

    const gallery = galleryList.galleries[galleryIndex]

    //if gallery has no title photo, first upload photo will be in titlePhoto
    if (!gallery.image) {
      gallery.image = imageData
      fs.writeFileSync(allGalleriesPath, JSON.stringify(galleryList), 'utf-8')
    }
    // else {
    //If gallery has already titlePhoto, image save in {name}.json

    let galleryListData = oneGalleryList(galleryName)
    galleryListData.images.push(imageData)
    const updatedData = JSON.stringify(galleryListData)
    fs.writeFileSync(galleryPath, updatedData, 'utf-8')
    //}

    res.status(201).json(response)
  } catch (err) {
    return res.status(500).json({ error: 'Error processing the request.', err })
  }
})

//if the request was to delete, the gallery
router.delete('/gallery/:gallery', (req, res) => {
  const galleryName = req.params.gallery
  if (!galleryExist(replaceSpaceWithPercent(galleryName))) {
    return res.status(404).json({ error: 'Gallery does not exist.' })
  }
  try {
    if (!fs.existsSync(databasePath))
      return res.status(500).json({ error: "Database doesn't exist." })

    const galleryList = allGalleriesList()
    const galleryIndex = galleryList.galleries.findIndex(
      (gallery) => gallery.path === replaceSpaceWithPercent(galleryName)
    )
    if (galleryIndex === -1)
      return res.status(404).json({ error: "Gallery doesn't exists." })

    //Delete gallery from GalleryDB.json
    const gallery = galleryList.galleries[galleryIndex]

    galleryList.galleries.splice(galleryIndex, 1)
    fs.writeFileSync(databasePath, JSON.stringify(galleryList))

    //Delete file gallery
    const galleryImagePath = path.join(
      __dirname,
      '../database',
      removePercentEncoding(gallery.path) + '.json'
    )
    fs.rmSync(galleryImagePath, { recursive: true })

    //Delete all images saved in gallery directory
    const galleryDirectoryPath = path.join(
      __dirname,
      '../images',
      removePercentEncoding(gallery.path)
    )
    fs.rmSync(galleryDirectoryPath, { recursive: true })

    //Delete titlePhoto directory
    /*const titlePhotoDirectoryPath = path.join(
      __dirname,
      '../images/titlePhoto',
      removePercentEncoding(gallery.path)
    )

    fs.rmSync(titlePhotoDirectoryPath, { recursive: true })
*/
    return res.status(200).json({ error: 'Gallery was deleted.' })
  } catch (err) {
    return res.status(500).json({ error: 'Error when deleting a gallery.' })
  }
})

//if the request was to delete the image
router.delete('/gallery/:gallery/:image', (req, res) => {
  const galleryName = req.params.gallery
  const imageName = req.params.image

  if (!req.url.includes('.jpeg')) {
    return res.status(500).json({ error: 'A image has to contain .jpeg' })
  }

  if (!galleryExist(replaceSpaceWithPercent(galleryName))) {
    return res.status(404).json({ error: 'Gallery does not exist.' })
  }

  const index = imageExist(galleryName, imageName)
  const galleryList = oneGalleryList(galleryName)
  if (index !== null) {
    galleryList.images.splice(index, 1)
    //Delete information about photo from {name}.json
    const updatedData = JSON.stringify(galleryList)

    try {
      fs.writeFileSync(
        path.join(
          __dirname,
          '../database',
          removePercentEncoding(galleryName) + '.json'
        ),
        updatedData,
        'utf-8'
      )
      //Delete image as file
      fs.unlinkSync(
        path.join(
          __dirname,
          '../images',
          removePercentEncoding(galleryName),
          removePercentEncoding(imageName)
        )
      )

      //delete information about titlePhoto if exist
      const galleriesList = allGalleriesList()
      const galleryIndex = galleriesList.galleries.findIndex(
        (gallery) => gallery.path === replaceSpaceWithPercent(galleryName)
      )
      if (galleryIndex !== -1)
        delete galleriesList.galleries[galleryIndex].image

      fs.writeFileSync(databasePath, JSON.stringify(galleriesList))
    } catch (err) {
      return res.status(500).json({ error: 'Error working with a file.', err })
    }
  } else {
    return res.status(404).json({ error: 'Image does not exist.' })
  }

  return res.status(200).json({ error: 'Image was deleted.' })
})

router.get('/images/:w(\\d+)x:h(\\d+)/:gallery/:image', (req, res) => {
  const { w, h } = req.params
  const galleryName = req.params.gallery
  const imageName = req.params.image

  if (!req.url.includes('.jpeg')) {
    return res.status(500).json({ error: 'The image must be a .jpeg.' })
  }
  if (!galleryExist(replaceSpaceWithPercent(galleryName))) {
    return res.status(404).json({ error: 'Gallery does not exist.' })
  }
  const index = imageExist(galleryName, imageName)
  if (index === null) {
    return res.status(404).json({ error: 'Photo not found.' })
  }
  const imageFilePath = path.join(
    __dirname,
    '../images/',
    galleryName,
    imageName
  )
  sharp(imageFilePath)
    .metadata()
    .then((metadata) => {
      const originalWidth = metadata.width
      const originalHeight = metadata.height

      let width, height

      if (w === '0') {
        // If the width is set to 0, calculate it from the height by keeping the aspect ratio
        height = parseInt(h)
        width = Math.round((height * originalWidth) / originalHeight)
      } else if (h === '0') {
        // If the height is set to 0, calculate it from the width by keeping the aspect ratio
        width = parseInt(w)
        height = Math.round((width * originalHeight) / originalWidth)
      }

      // If the height and width is set to 0, it's error
      else if (w === '0' && h === '0') {
        res.status(500).json({ error: "The photo preview can't be generated." })
      } else {
        width = parseInt(w)
        height = parseInt(h)
      }
      sharp(imageFilePath)
        .resize(width, height)
        .toFormat(metadata.format)
        .toBuffer()
        .then((data) => {
          res.set('Content-Type', `image/${metadata.format}`)
          res.status(200).send(data)
        })
        .catch((error) => {
          res
            .status(500)
            .json({ error: "The photo preview can't be generated.", error })
        })
    })
    .catch((error) => {
      res
        .status(500)
        .json({ error: "The photo preview can't be generated.", error })
    })
})

//replace space with %20
function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) return name.replace(/ /g, '%20')

  return name
}
//replace %20 with space
function removePercentEncoding(name) {
  if (name.includes('%20')) return name.replace(/%20/g, ' ')

  return name
}

//if generally database exist and if doesn't create it with basic structure
function galleryExist(name) {
  try {
    const galleryList = JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
    const gallery = galleryList.galleries.find(
      (gallery) => gallery.path === name
    )
    if (gallery) return true
    return false
  } catch (err) {
    throw err
  }
}

//if specify gallery database exist return all of it and if doesn't create it with basic structure
function oneGalleryList(name) {
  const galleryName = name
  const galleryPath = path.join(__dirname, '../database', galleryName + '.json')
  const galleryList = {
    gallery: {
      path: replaceSpaceWithPercent(galleryName),
      name: galleryName,
    },
    images: [],
  }

  try {
    if (!fs.existsSync(galleryPath))
      fs.writeFileSync(galleryPath, JSON.stringify(galleryList))

    const galleryData = fs.readFileSync(path.join(galleryPath), 'utf-8')

    if (galleryData.length > 0) return JSON.parse(galleryData)
    else return galleryList
  } catch (err) {
    throw err
  }
}

function allGalleriesList() {
  const galleryPath = path.join(__dirname, '../database/GalleryDB.json')

  try {
    const galleryData = fs.readFileSync(path.join(galleryPath), 'utf-8')

    return JSON.parse(galleryData)
  } catch (err) {
    throw err
  }
}

//If image exist in gallery return it's index if it isn't return null
function imageExist(gallery, imageName) {
  try {
    const galleryList = oneGalleryList(gallery)
    const index = galleryList.images.findIndex(
      (image) => image.name === imageName
    )
    return index !== -1 ? index : null
  } catch (err) {
    throw err
  }
}

module.exports = router
