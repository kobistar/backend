const Ajv = require('ajv')
const gallerySchema = require('../schemas/galleryValidateSchemas.js')
const dataExistence = require('../services/data_existence.js')
const workWithData = require('../services/galleryServices.js')
const ajv = new Ajv()

function isDataValid(req, res) {
  return isContentTypeJson(res, req.headers) &&
    isRequestValid(res, req.body) &&
    checkSlashPresence(res, req.body.name)
    ? true
    : false
}

function isImageResizeValid(req, res) {
  const galleryName = req.params.gallery
  const imageName = req.params.image
  const { w, h } = req.params

  return isImageRightSize(w, h, res) &&
    galleryExist(galleryName, res) &&
    isImageCorrect(req, res) &&
    imageExist(galleryName, imageName, res)
    ? true
    : false
}

function isUploadFileValid(req, res) {
  const galleryName = req.params.gallery

  return isUploadCorrectFile(req, res) &&
    galleryExist(galleryName, res) &&
    isFileUpload(req, res)
    ? true
    : false
}

function isDeleteImageValid(req, res) {
  const galleryName = req.params.gallery
  const imageName = req.params.image

  return galleryExist(galleryName, res) &&
    isImageCorrect(req, res) &&
    imageExist(galleryName, imageName, res)
    ? true
    : false
}

function isResponseValid(res, responseData) {
  const validateResponse = ajv.compile(gallerySchema.galleryGetSchema)

  if (!validateResponse(responseData)) {
    res.status(500).json(validateResponse.errors)
    return false
  }
  return true
}

function isOneGalleryResponseValid(res, responseData) {
  const validateResponse = ajv.compile(gallerySchema.oneGalleryGetSchema)

  if (!validateResponse(responseData)) {
    res.status(500).json(validateResponse.errors)
    return false
  }
  return true
}

function isRequestValid(res, requestData) {
  const validateRequest = ajv.compile(gallerySchema.galleryPostSchema)

  if (!validateRequest(requestData)) {
    const errors = validateRequest.errors
    res.status(400).json({
      error: "Invalid request. The request doesn't conform to the schema.",
      errors,
    })
    return false
  }
  return true
}

function isContentTypeJson(res, dataHeader) {
  const contentType = dataHeader['content-type']
  if (!contentType.toLowerCase().startsWith('application/json')) {
    res.status(500).json({ error: 'Invalid JSON format.' })
    return false
  }
  return true
}

function checkSlashPresence(res, name) {
  if (name.includes('/')) {
    res.status(400).json({ error: 'Name can not contain slash.' })
    return false
  }
  return true
}

function isFileUpload(req, res) {
  if (!req.file) {
    res.status(500).json({ error: 'The file did not upload.' })
    return false
  }
  return true
}

function isImageCorrect(req, res) {
  if (!req.url.includes('.jpeg')) {
    res.status(500).json({ error: 'A image has to contain .jpeg' })
    return false
  }
  return true
}

function galleryExist(galleryName, res) {
  if (
    dataExistence.galleryExist(
      workWithData.parseData('GalleryDB'),
      galleryName
    ) === -1
  ) {
    res.status(404).json({ error: 'Gallery does not exist.' })
    return false
  }

  return true
}

function imageExist(galleryName, imageName, res) {
  if (
    dataExistence.imageExist(workWithData.parseData(galleryName), imageName) ===
    -1
  ) {
    res.status(404).json({ error: 'Image does not exist.' })
    return false
  }
  return true
}

function isUploadCorrectFile(req, res) {
  if (
    req.fileFilterError &&
    req.fileFilterError.code === 'UNSUPPORTED_MEDIA_TYPE'
  ) {
    res.status(500).json({ error: req.fileFilterError.error })
    return false
  }
  return true
}

function isImageRightSize(w, h, res) {
  if (w === '0' && h === '0') {
    res.status(500).json({ error: "The photo preview can't be generated." })
    return false
  }
  return true
}

module.exports = {
  isDataValid,
  isResponseValid,
  isOneGalleryResponseValid,
  isFileUpload,
  isImageCorrect,
  galleryExist,
  isUploadCorrectFile,
  imageExist,
  isImageRightSize,
  isImageResizeValid,
  isUploadFileValid,
  isDeleteImageValid,
}
