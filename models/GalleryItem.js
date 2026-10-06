import mongoose from 'mongoose'

const galleryItemSchema=new mongoose.Schema({
  title:{type:String,required:true,trim:true,maxLength:160},
  description:{type:String,trim:true,default:'',maxLength:1000},
  mediaUrl:{type:String,required:true},
  mediaPublicId:{type:String,default:''},
  mediaResourceType:{type:String,enum:['image','video'],required:true},
  mediaProvider:{type:String,enum:['cloudinary','youtube'],default:'cloudinary'}
},{timestamps:true})

export default mongoose.model('GalleryItem',galleryItemSchema)
