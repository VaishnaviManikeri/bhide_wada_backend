import HeroImage from '../models/HeroImage.js'
import {createContentController} from '../utils/createContentController.js'

export default createContentController({
  Model:HeroImage,
  fields:['title','altText','active'],
  mediaRequired:true,
  mediaTypes:['image'],
  publicFilter:{active:true},
  sort:{createdAt:-1}
})
