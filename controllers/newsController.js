import News from '../models/News.js'
import {createContentController} from '../utils/createContentController.js'

export default createContentController({
  Model:News,
  fields:['title','summary','content']
})
