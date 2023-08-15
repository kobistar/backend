import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import moment from 'moment'
import workWithData from '../services/galleryServices.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
  const fullPathToImage = join(
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

const gallerySchema = {
  galleryData,
  oneGalleryData,
  imageData,
  response,
  fileErrorSchema,
}

export default gallerySchema
