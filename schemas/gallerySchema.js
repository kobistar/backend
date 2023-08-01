const galleryPostSchema = {
  title: 'Gallery list insert schema',
  type: 'object',
  properties: {
    name: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
}

const galleryGetSchema = {
  title: 'Gallery list schema',
  type: 'object',
  properties: {
    galleries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          name: { type: 'string' },
          image: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              fullpath: { type: 'string' },
              name: { type: 'string' },
              modified: { type: 'string' },
            },
            required: ['path', 'fullpath', 'name', 'modified'],
          },
        },
        required: ['path', 'name'],
      },
    },
  },
  required: ['galleries'],
  additionalProperties: true,
}

const oneGalleryGetSchema = {
  title: 'Gallery detail schema',
  type: 'object',
  properties: {
    gallery: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['path', 'name'],
    },
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          fullpath: { type: 'string' },
          name: { type: 'string' },
          modified: { type: 'string' },
        },
        required: ['path', 'fullpath', 'name', 'modified'],
      },
    },
  },
  required: ['gallery', 'images'],
  additionalProperties: true,
}

module.exports = { galleryPostSchema, galleryGetSchema, oneGalleryGetSchema }
