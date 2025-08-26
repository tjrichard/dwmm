import { type SchemaTypeDefinition } from 'sanity'
import {workType} from './workType'
import {categoryType} from './categoryType'
import {tagType} from './tagType'
import {seoObject} from './objects/seo'
import {imageGalleryObject} from './objects/imageGallery'
import {embedObject} from './objects/embed'
import {reactComponentObject} from './objects/reactComponent'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    workType,
    categoryType,
    tagType,
    // objects
    seoObject,
    imageGalleryObject,
    embedObject,
    reactComponentObject,
  ],
}
