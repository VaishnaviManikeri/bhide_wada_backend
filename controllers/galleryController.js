import GalleryItem from '../models/GalleryItem.js'
import {createContentController} from '../utils/createContentController.js'

export default createContentController({
  Model:GalleryItem,
  fields:['title','description'],
  mediaRequired:true,
  remoteMediaField:'mediaSourceUrl',
  remoteMediaTypeField:'mediaSourceType'
})
