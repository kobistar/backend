const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp');
const router = express.Router()
const jsonPath = path.join(__dirname, '../database/GalleryDB.json')
const dataParser = require('../services/oneGalleryServices.js')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/', req.params.path)) 
  },
  filename: function (req, file, cb) { cb(null, file.originalname) }
})

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


router.get('/gallery/:path', (req, res) => {
  try {
    
    if (!galleryExist(req)) return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exist' })
    
    res.status(200).render('../views/galleries/gallery.ejs', { galleryData: oneGalleryList(req)})
  } 
  catch (err) {
    console.error(err)
    return res.status(500).render('../views/partials/back.ejs', { Message: 'Internal Server Error ' })
  }
})


router.post('/gallery/:path', upload.single('galleryImage'),(req, res) => {

  if(req.file.originalname === null) return res.status(400).render('../views/partials/back.ejs', { Message: 'Invalid request - file not found.' })

  if(req.file.originalname === req.params.path) return res.status(500).render('../views/partials/back.ejs', { Message: 'An image can not have the same name as its gallery.' })

  const galleryPath = path.join(__dirname, '../database', req.params.path + '.json')
  console.log(galleryPath)
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
    if (!galleryExist(req)) return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery not found' })

    let galleryListData = oneGalleryList(req)
    galleryListData.images.push(imageData)

    const updatedData = JSON.stringify(galleryListData)
    fs.writeFileSync(galleryPath, updatedData, 'utf-8')

    res.status(201).render('../views/partials/response.ejs', {response: response})
  } 
  catch (err) {
    console.error(err)
    return res.status(500).render('../views/partials/back.ejs', { Message: 'Error processing the request' })
  }
})

router.delete('/gallery/:path', (req, res) => {
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
      return res.status(400).render('../views/partials/back.ejs', { Message: 'Gallery does not exists' })
    }

    return res.status(200).render('../views/partials/back.ejs', { Message: 'Gallery was deleted' })
  } catch (err) {
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error with deleting.' })
  }
})

router.get('/images/:w(\\d+)x:h(\\d+)/:path', (req, res) => {
  const { w, h, path: imagePath } = req.params;
  const parameter = imagePath.replace(/:/g, '/');
  const imageFilePath = path.join(__dirname, '../images/', parameter);

  sharp(imageFilePath)
    .metadata()
    .then((metadata) => {
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      let width, height;

      if (w === '0') {
        // Ak je šírka nastavená na 0, dopočítajte ju z výšky zachovaním pomeru strán
        height = parseInt(h);
        width = Math.round((height * originalWidth) / originalHeight);
      } else if (h === '0') {
        // Ak je výška nastavená na 0, dopočítajte ju zo šírky zachovaním pomeru strán
        width = parseInt(w);
        height = Math.round((width * originalHeight) / originalWidth);
      } else {
        // Ak sú šírka a výška explicitne zadané, použite ich hodnoty
        width = parseInt(w);
        height = parseInt(h);
      }

      sharp(imageFilePath)
        .resize(width, height)
        .toFormat(metadata.format)
        .toBuffer()
        .then((data) => {
          res.set('Content-Type', `image/${metadata.format}`);
          res.send(data);
        })
        .catch((error) => {
          console.error('Chyba pri úprave obrázka:', error);
          res.status(500).send('Interná serverová chyba');
        });
    })
    .catch((error) => {
      console.error('Chyba pri získavaní metadát obrázka:', error);
      res.status(500).send('Interná serverová chyba');
    });
});


function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) return name.replace(/ /g, '%20')
  
  return name
}

function removePercentEncoding(name) {
  if (name.includes('%20')) return name.replace(/%20/g, ' ')
  
  return mame
}

//if generally database exist and if doesn't create it with basic structure
function galleryExist(req){
  try{
    if (!fs.existsSync(jsonPath)) fs.writeFileSync(jsonPath, JSON.stringify({ galleries: [] }))

    const galleryList = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const gallery = galleryList.galleries.find(gallery => gallery.path === replaceSpaceWithPercent(req.params.path))

    if(gallery) return true
    return false
  }
  catch(err){
    console.error(err)
    throw err
  }
}

//if specify galerry database exist return all of it and if doesn't create it with basic structure
function oneGalleryList(req){
  const galleryName = req.params.path
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
    console.error(err)
    throw err
  }
}
module.exports = router
