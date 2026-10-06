import Event from '../models/Event.js'
import {createContentController} from '../utils/createContentController.js'

export default createContentController({
  Model:Event,
  fields:['title','summary','content','date','location'],
  sort:{date:1}
})
