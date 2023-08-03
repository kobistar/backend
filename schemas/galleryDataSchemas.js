const path = require('path')
const moment = require('moment')

const workWithData = require('../services/galleryServices.js')

function galleryData(galleryName) {
  return {
    path: workWithData.replaceSpaceWithPercent(galleryName),
    name: galleryName,
  }
}

function oneGalleryData(galleryName) {
  return { gallery: galleryData(galleryName), images: [] }
}

function imageData(imageName, galleryName) {
  const fullPathToImage = path.join(
    workWithData.replaceSpaceWithPercent(galleryName),
    workWithData.replaceSpaceWithPercent(imageName)
  )
  return {
    path: workWithData.replaceSpaceWithPercent(imageName),
    fullpath: fullPathToImage,
    name: imageName,
    modified: moment().format(),
  }
}

function response(imageName, galleryName) {
  return {
    uploaded: [imageData(imageName, galleryName)],
  }
}

function fileErrorSchema(error, code) {
  return {
    error: error,
    code: code,
  }
}

module.exports = {
  galleryData,
  oneGalleryData,
  imageData,
  response,
  fileErrorSchema,
}
