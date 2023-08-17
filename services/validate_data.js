import Ajv from 'ajv'
import gallerySchema from '../schemas/galleryValidateSchemas.js'
import dataExistence from '../services/data_existence.js'
import workWithData from '../services/galleryServices.js'

const ajv = new Ajv()

function isDataValid(req, res) {
  return (
    isRequestBlank(req, res) &&
    isContentTypeJson(res, req.headers) &&
    isRequestValid(res, req.body) &&
    checkSlashPresence(res, req.body.name)
  )
}

function isImageResizeValid(req, res) {
  const galleryName = req.params.gallery
  const imageName = req.params.image
  const { w, h } = req.params

  return (
    isImageRightSize(w, h, res) &&
    ifGalleryExist(galleryName, res) &&
    isImageCorrect(req, res) &&
    ifImageExist(galleryName, imageName, res)
  )
}

function isUploadFileValid(req, res) {
  const galleryName = req.params.gallery
  return (
    ifGalleryExist(galleryName, res) &&
    isUploadCorrectFile(req, res) &&
    isFileUpload(req, res) &&
    isImageAlreadyExist(galleryName, req.file.originalname, res)
  )
}

function isDeleteImageValid(req, res) {
  const galleryName = req.params.gallery
  const imageName = req.params.image

  return (
    ifGalleryExist(galleryName, res) &&
    isImageCorrect(req, res) &&
    ifImageExist(galleryName, imageName, res)
  )
}

function isImageCorrect(req, res) {
  if (!req.url.includes('.jpeg')) {
    res.status(500).json({ error: 'A image has to contain .jpeg' })
    return false
  }
  return true
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

function isRequestBlank(req, res) {
  console.log(req.body)
  //console.log(req)
  if (Object.keys(req.body).length === 0) {
    //console.log("1")
    res.status(500).json({ error: 'Request is blank. There is no data.' })
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
    res.status(500).json({ error: 'No_file' })
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

function ifGalleryExist(galleryName, res) {
  if (
    dataExistence.galleryExist(workWithData.parseData(), galleryName) === -1
  ) {
    res.status(404).json({ error: 'Gallery does not exist.' })
    return false
  }

  return true
}

function ifImageExist(galleryName, imageName, res) {
  if (
    dataExistence.imageExist(workWithData.parseData(galleryName), imageName) ===
    -1
  ) {
    res.status(404).json({ error: 'Image does not exist.' })
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

function isImageAlreadyExist(galleryName, imageName, res) {
  if (
    dataExistence.imageExist(workWithData.parseData(galleryName), imageName) !==
    -1
  ) {
    res.status(409).json({ error: 'Image already exist in this gallery.' })
    return false
  }
  return true
}

function isTitlePhotoExist(galleriesList, galleryName, imageName) {
  const gallery = galleriesList.galleries.find(
    (gallery) => gallery.name === galleryName
  )
  if (gallery.image && gallery.image.name === imageName) return true

  return false
}

function isNumberAndValid(req, res) {
  let boolValue = false
  if (req.query.page) boolValue = isQueryValid(req.query.page, res)
  if (req.query.limit) boolValue = isQueryValid(req.query.limit, res)

  return boolValue
}

function isQueryValid(query, res) {
  if (isNaN(query)) {
    res.status(500).json({ error: 'Query page and limit must be a number.' })
    return false
  }
  if (!isNaN(query) && query <= 0) {
    res
      .status(500)
      .json({ error: 'Query page and limit must be a higher number than 0.' })
    return false
  }

  return true
}


const validateData = {
  isDataValid,
  isResponseValid,
  isImageCorrect,
  isOneGalleryResponseValid,
  isFileUpload,
  ifGalleryExist,
  isRequestBlank,
  isUploadCorrectFile,
  ifImageExist,
  isImageRightSize,
  isImageResizeValid,
  isUploadFileValid,
  isDeleteImageValid,
  isImageAlreadyExist,
  isTitlePhotoExist,
  isNumberAndValid,
  isQueryValid,
}

export default validateData
