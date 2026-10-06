import mongoose from 'mongoose'

const heroImageSchema=new mongoose.Schema({
  title:{type:String,required:true,trim:true,maxLength:160},
  altText:{type:String,required:true,trim:true,maxLength:300},
  active:{type:Boolean,default:true},
  mediaUrl:{type:String,required:true},
  mediaPublicId:{type:String,required:true},
  mediaResourceType:{type:String,enum:['image'],default:'image'},
  mediaProvider:{type:String,enum:['cloudinary'],default:'cloudinary'}
},{timestamps:true})

export default mongoose.model('HeroImage',heroImageSchema)
