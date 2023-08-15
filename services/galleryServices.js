import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import bodyParser from 'body-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseData(galleryName = 'GalleryDB') {
  try {
    const databasePath = join(__dirname, '../database/', galleryName + '.json')
    return JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
  } catch (err) {
    throw err
  }
}

function saveData(galleryList, galleryName = 'GalleryDB') {
  const databasePath = join(__dirname, '../database/', galleryName + '.json')
  try {
    fs.writeFileSync(databasePath, JSON.stringify(galleryList), 'utf-8')
  } catch (err) {
    throw err
  }
}

function replaceSpaceWithPercent(name) {
  return name && name.includes(' ') ? (name = name.replace(/ /g, '%20')) : name
}

function resizeImage(w, h, originalWidth, originalHeight) {
  let width, height
  if (w === '0') {
    // If the width is set to 0, calculate it from the height by keeping the aspect ratio
    height = parseInt(h)
    width = Math.round((height * originalWidth) / originalHeight)
  } else if (h === '0') {
    // If the height is set to 0, calculate it from the width by keeping the aspect ratio
    width = parseInt(w)
    height = Math.round((width * originalHeight) / originalWidth)
  } else {
    width = parseInt(w)
    height = parseInt(h)
  }

  return { width, height }
}

function conditionalBodyParser(req, res, next) {
  if (req.path === '/gallery') {
    bodyParser.text({ type: '*/*' })(req, res, next)
  } else {
    next()
  }
}

const workWithData = {
  parseData,
  saveData,
  replaceSpaceWithPercent,
  resizeImage,
  conditionalBodyParser,
}
export default workWithData
