function galleryExist(galleryList, galleryName) {
  const galleryIndex = galleryList.galleries.findIndex(
    (gallery) => gallery.name === galleryName
  )
  return galleryIndex
}

function imageExist(galleryList, imageName) {
  const imageIndex = galleryList.images.findIndex(
    (image) => image.name === imageName
  )
  return imageIndex
}

function titlePhotoExist(galleryList, imageName) {
  const imageIndex = galleryList.galleries.findIndex(
    (gallery) => gallery.image.name === imageName
  )
  return imageIndex
}

module.exports = { galleryExist, imageExist, titlePhotoExist}
