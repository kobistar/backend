const path = require('path')
const fs = require('fs')

function parseData(galleryName) {
  try {
    const databasePath = path.join(
      __dirname,
      '../database/',
      galleryName + '.json'
    )
    return JSON.parse(fs.readFileSync(databasePath, 'utf-8'))
  } catch (err) {
    throw err
  }
}

function saveData(galleryList, galleryName) {
  const databasePath = path.join(
    __dirname,
    '../database/',
    galleryName + '.json'
  )
  try {
    fs.writeFileSync(databasePath, JSON.stringify(galleryList), 'utf-8')
  } catch (err) {
    throw err
  }
}

function replaceSpaceWithPercent(name) {
  if (name && name.includes(' ')) name = name.replace(/ /g, '%20')

  return name
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

module.exports = { parseData, saveData, replaceSpaceWithPercent, resizeImage }
