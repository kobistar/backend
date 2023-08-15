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

const dataExistence = { galleryExist, imageExist }

export default dataExistence
