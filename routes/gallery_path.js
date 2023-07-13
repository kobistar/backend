const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../images/', req.params.path)) 
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

const jsonPath = path.join(__dirname, '../database/GalleryDB.json')


router.get('/gallery/:path', (req, res) => {
    
    if(!fs.existsSync(jsonPath)) return res.send(500).render('../views/partials/back.ejs', { Message: "Database doesn't exist "})

    fs.readFile(jsonPath, 'utf-8', (err, data) => {
      if (err) {
          console.error(err)
          return res.status(500).render('../views/partials/back.ejs', { Message: 'Error reading database' })
      }
      
      let galleryList
      if (data.length > 0) galleryList = JSON.parse(data)
      
      else return res.send(500).render('../views/partials/back.ejs', { Message: "Database is empty"})
      

      const gallery = galleryList.galleries.find(gallery => gallery.path === req.params.path)
      if (!gallery) {
        return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery does not exist' })
      }
  })

  const galleryPath = path.join(__dirname,'../database', req.params.path + ".json")

  fs.readFile(galleryPath, 'utf-8', (err, data) => {
    
    let galleryList
      if (data.length > 0) galleryList = JSON.parse(data)
      
      else galleryList = { }

    res.status(200).render('../views/galleries/gallery.ejs', { galleryData: galleryList })
  })
})


router.post('/gallery/:path', upload.single('galleryImage'),(req, res) => {
  const galleryPath = path.join(__dirname,'../database', req.params.path + ".json")
  
  const imageData = {
    path: replaceSpaceWithPercent(req.file.originalname),
    fullpath: path.join(req.params.path, replaceSpaceWithPercent(req.file.originalname)),
    name: req.file.originalname,
    modified: new Date().toISOString()
  }

  
  fs.readFile(jsonPath, 'utf-8', (err, data) => {
    if (err) {
      console.error(err)      
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error reading from database' })
    }

    let galleryList
    if (data.length > 0) galleryList = JSON.parse(data)
    
    else galleryList = { }

    const gallery = galleryList.galleries.find(gallery => gallery.path === req.params.path)
      
    if (!gallery) {
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Gallery not found' })
    }
  })


  fs.readFile(galleryPath, 'utf-8', (err, data) => {
    if (err) {
      console.error(err)      
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error reading from gallery database' })
    }

    let galleryList = JSON.parse(data)
      galleryList.images.push(imageData)
      
      const updatedData = JSON.stringify(galleryList)
      fs.writeFile(galleryPath, updatedData, 'utf-8', (err) => {
        if (err) {
          console.error(err)
          return res.status(500).render('../views/partials/back.ejs', { Message: 'Error write to database' })
        }
      })

      res.status(200).render('../views/partials/response.ejs')
  })
})


router.delete('/gallery/:path', (req, res) => {
  const galleryName = req.params.path
  const jsonPath = path.join(__dirname, '../database/', galleryName + '.json')
  const galleryPath = path.join(__dirname, '../database/GalleryDB.json')
  const imagePath = path.join(__dirname, "../images", galleryName)

  fs.readFile(galleryPath, 'utf-8', (err, data) => {
    if (err) {
      console.error(err)      
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error reading from gallery database' })
    }

    let galleryList = JSON.parse(data)

    const imageIndex = galleryList.galleries.findIndex(gallery => gallery.path === galleryName)
  
    if (imageIndex !== -1) {
      galleryList.galleries.splice(imageIndex, 1)
      
      fs.writeFile(galleryPath, JSON.stringify(galleryList), 'utf-8', (err) => {
        if (err) {
          console.error(err)
          return res.status(500).render('../views/partials/back.ejs', { Message: 'Error deleting image from gallery' })
        }

        fs.unlink(jsonPath, (err) => {
          if (err) {
            console.error(err)
            return res.status(500).render('../views/partials/back.ejs', { Message: 'Error deleting image.' })
          }
        })

        fs.rmdir(imagePath, { recursive: true }, (err) => {
          if (err) {
            console.error(err)
            return res.status(500).render('../views/partials/back.ejs', { Message: 'Error deleting directory.' })
          }
        })
  
        return res.status(200).render('../views/partials/back.ejs', { Message: 'Image deleted successfully.' })
      })
    } else {
      return res.status(404).render('../views/partials/back.ejs', { Message: 'Image not found.' })
    }
  })
})

router.delete('/gallery/:galleryName/:imageName', (req, res) => {
  const galleryName = req.params.galleryName
  const imageName = req.params.imageName
  
  const imagePath = path.join(__dirname, "../images", galleryName, imageName)
  const galleryPath = path.join(__dirname, "../database", galleryName + ".json")
  
  fs.unlink(imagePath, (unlinkErr) => {
    if (unlinkErr) {
      console.error(unlinkErr)
      return res.status(500).render('../views/partials/back.ejs', { Message: 'Error deleting image.' })
    }
    
    fs.readFile(galleryPath, 'utf-8', (readErr, data) => {
      if (readErr) {
        console.error(readErr)
        return res.status(500).render('../views/partials/back.ejs', { Message: 'Error reading gallery file.' })
      }
  
      let galleryData = JSON.parse(data)
  
      const updatedImages = galleryData.images.filter(image => image.path !== imagePath)
  
      galleryData.images = updatedImages
  
      fs.writeFile(galleryPath, JSON.stringify(galleryData, null, 2), 'utf-8', (writeErr) => {
        if (writeErr) {
          console.error(writeErr)
          return res.status(500).render('../views/partials/back.ejs', { Message: 'Error updating gallery file.' })
        }
  
        return res.status(200).render('../views/partials/back.ejs', { Message: 'Image deleted successfully.' })
      })
    })
  })
})


function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) name = name.replace(/ /g, '%20')
  
  return name
}


module.exports = router
