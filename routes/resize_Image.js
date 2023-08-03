const express = require('express')
const path = require('path')
const sharp = require('sharp')
const router = express.Router()
const validateData = require('../services/validate_Data.js')
const workWithData = require('../services/galleryServices.js')

router.get('/images/:w(\\d+)x:h(\\d+)/:gallery/:image', (req, res) => {
  const { w, h } = req.params
  const galleryName = req.params.gallery
  const imageName = req.params.image

  if (validateData.isImageResizeValid(req, res)) {
    const imageFilePath = path.join(
      __dirname,
      '../images/',
      galleryName,
      imageName
    )
    sharp(imageFilePath)
      .metadata()
      .then((metadata) => {
        const resize = workWithData.resizeImage(w, h, metadata.width, metadata.height)
        let width = resize.width
        let height = resize.height

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
  }
})

module.exports = router
