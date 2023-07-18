const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const router = express.Router()
const jsonPath = path.join(__dirname, '../database/GalleryDB.json')

//Defines a configuration for saving uploaded files to disk, 
//where the path to the destination folder and the filename 
//are derived from the request parameters and the original filename.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/', req.params.path)) 
  },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})


//Allows you to upload files to the server and filter them by allowed types.
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpg', 'image/png']
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error('Only JPG and PNG files are allowed')
      error.code = 'UNSUPPORTED_MEDIA_TYPE'
      return cb(error, false)
    }
    cb(null, true)
  }
})

//The contents of a specific gallery will be displayed with information about all photos
router.get('/gallery/:path', (req, res) => {
  try {
    
    //Checks whether the gallery exists
    if (!galleryExist(replaceSpaceWithPercent(req.params.path))) return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exist' })

    //if the gallery database exists, the oneGalleryList function is called, which will contain information about the gallery
    res.status(200).render('../views/galleries/gallery.ejs', { galleryData: oneGalleryList(req.params.path)})
  } 
  catch (err) {
    return res.status(500).render('../views/partials/back.ejs', { Message: 'Internal Server Error ' })
  }
})

//Adding a new photo to the gallery
router.post('/gallery/:path', upload.single('galleryImage'),(req, res) => {

  if(req.file.originalname === null) return res.status(400).render('../views/partials/back.ejs', { Message: 'Invalid request - file not found.' })

  if(req.file.originalname === req.params.path) return res.status(500).render('../views/partials/back.ejs', { Message: 'An image can not have the same name as its gallery.' })

  const galleryPath = path.join(__dirname, '../database', req.params.path + '.json')

  const imageData = {
    path: replaceSpaceWithPercent(req.file.originalname),
    fullpath: path.join(replaceSpaceWithPercent(req.params.path), replaceSpaceWithPercent(req.file.originalname)),
    name: req.file.originalname,
    modified: new Date().toISOString()
  }

  const response = {
    uploaded: [{
      path: replaceSpaceWithPercent(req.file.originalname),
      fullpath: path.join(replaceSpaceWithPercent(req.params.path), replaceSpaceWithPercent(req.file.originalname)),
      name: req.file.originalname,
      modified: new Date().toISOString()
    }]
  }

  try {
    if (!galleryExist(replaceSpaceWithPercent(req.params.path))) return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery not found' })

    let galleryListData = oneGalleryList(req.params.path)
    galleryListData.images.push(imageData)

    const updatedData = JSON.stringify(galleryListData)
    fs.writeFileSync(galleryPath, updatedData, 'utf-8')

    res.status(201).render('../views/partials/response.ejs', {response: response})
  } 
  catch (err) {
    return res.status(500).render('../views/partials/back.ejs', { Message: 'Error processing the request' })
  }
})

router.delete('/gallery/:path', (req, res) => {

  //if the request was to delete the image
  if(req.params.path.includes('.png') || req.params.path.includes('.jpg')){
    const parameters = req.params.path.split('/')
    const directory = parameters[0]
    const filename = parameters[1]
    if (!galleryExist(replaceSpaceWithPercent(directory))){
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exist'})
    }

    const index = imageExist(directory, filename)

    const galleryList = oneGalleryList(directory)
    
    if (index !== null) {
      galleryList.images.splice(index, 1)
      const updatedData = JSON.stringify(galleryList)
      
      try{
        fs.writeFileSync(path.join(__dirname, "../database", removePercentEncoding(directory) + '.json'), updatedData, 'utf-8')
        fs.unlinkSync(path.join(__dirname, "../images", removePercentEncoding(directory), removePercentEncoding(filename)))
      }
      catch(err){
        return res.status(500).render('../views/partials/back.ejs', { Message: 'Error writing to file.' })
      }
    }

    else{
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Image does not exist.' })
    }

    return res.status(200).render('../views/partials/back.ejs', { Message: 'Image was deleted.' })
  }

  //if the request was to delete, the gallery
  try {
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }))
    const galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const galleryIndex = galleryList.galleries.findIndex(gallery => gallery.path === replaceSpaceWithPercent(req.params.path))
    if (galleryIndex !== -1) {

      //Delete gallery from GalleryDB.json
      const gallery = galleryList.galleries[galleryIndex]

      galleryList.galleries.splice(galleryIndex, 1)
      fs.writeFileSync(jsonPath, JSON.stringify(galleryList))

      //Delete file gallery
      const galleryImagePath = path.join(__dirname, "../database", removePercentEncoding(gallery.path) + '.json')
      fs.rmSync(galleryImagePath, { recursive: true })

      //Delete all images saved in gallery directory
      const galleryDirectoryPath = path.join(__dirname, "../images", removePercentEncoding(gallery.path))
      fs.rmSync(galleryDirectoryPath, { recursive: true })
    }
    else{
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exists' })
    }

    return res.status(200).render('../views/partials/back.ejs', { Message: 'Gallery was deleted' })
  }

  catch (err) {
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error when deleting a gallery.' })
  }
})

router.get('/images/:w(\\d+)x:h(\\d+)/:path', (req, res) => {
  const { w, h } = req.params
  if(req.params.path.includes('.png') || req.params.path.includes('.jpg')){
    const parameters = req.params.path.split('/')
    const directory = parameters[0]
    const filename = parameters[1]
    if (!galleryExist(replaceSpaceWithPercent(directory))){
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exist'})
    }

    const index = imageExist(directory, filename)
    if(index === null){
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Photo not found' })
    }
  }

  //const parameter = imagePath.replace(/:/g, '/')
  const imageFilePath = path.join(__dirname, '../images/', req.params.path)

  sharp(imageFilePath)
    .metadata()
    .then((metadata) => {
      const originalWidth = metadata.width
      const originalHeight = metadata.height

      let width, height

      if(w === '0'){
        // If the width is set to 0, calculate it from the height by keeping the aspect ratio
        height = parseInt(h)
        width = Math.round((height * originalWidth) / originalHeight)
      }
      else if(h === '0'){
        // If the height is set to 0, calculate it from the width by keeping the aspect ratio
        width = parseInt(w)
        height = Math.round((width * originalHeight) / originalWidth)
      }

      // If the height and width is set to 0, it's error
      else if(w === '0' && h === '0'){
        res.status(500).send("The photo preview can't be generated.")
      }

      else{
        // If the width and height are explicitly specified, use their values
        width = parseInt(w)
        height = parseInt(h)
      }

      sharp(imageFilePath)
        .resize(width, height)
        .toFormat(metadata.format)
        .toBuffer()
        .then((data) => {
          res.set('Content-Type', `image/${metadata.format}`)
          res.send(data)
        })
        .catch((error) => {
          res.status(500).send("The photo preview can't be generated.")
        })
    })
    .catch((error) => {
      res.status(500).send("The photo preview can't be generated.")
    })
})

//replace space with %20
function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) return name.replace(/ /g, '%20')
  
  return name
}
//replace %20 with space
function removePercentEncoding(name) {
  if (name.includes('%20'))
    return name.replace(/%20/g, ' ')
  
  return name
}

//if generally database exist and if doesn't create it with basic structure
function galleryExist(name){
  try{
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }))

    const galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const gallery = galleryList.galleries.find(gallery => gallery.path === name)

    if(gallery) return true
    return false
  }
  catch(err){
    throw err
  }
}

//if specify galerry database exist return all of it and if doesn't create it with basic structure
function oneGalleryList(name){
  const galleryName = name
  const galleryPath = path.join(__dirname, '../database', galleryName + '.json')
  const galleryList = {
    gallery:{
      path: replaceSpaceWithPercent(galleryName),
      name: galleryName
    },
    images: []
  }

  try{
    if (!fs.existsSync(galleryPath)) fs.writeFileSync(galleryPath, JSON.stringify(galleryList))

    const galleryData = fs.readFileSync(path.join(galleryPath), 'utf-8')
    
    if (galleryData.length > 0) return JSON.parse(galleryData)
    else return galleryList
  }
  catch(err){
    throw err
  }
}

//If image exist in gallery return it's index if it isn't return null 
function imageExist(directory, filename){
  try{
   
    const galleryList = oneGalleryList(directory)
    const index = galleryList.images.findIndex(image => image.name === filename)
    return index !== -1 ? index : null

  }
  catch(err){
    throw err
  }
}

module.exports = router
