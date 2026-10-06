import mongoose from 'mongoose'

const eventSchema=new mongoose.Schema({
  title:{type:String,required:true,trim:true,maxLength:160},
  summary:{type:String,required:true,trim:true,maxLength:500},
  content:{type:String,required:true,trim:true,maxLength:10000},
  date:{type:Date,required:true},
  location:{type:String,required:true,trim:true,maxLength:250},
  mediaUrl:{type:String,default:''},
  mediaPublicId:{type:String,default:''},
  mediaResourceType:{type:String,default:''}
},{timestamps:true})

export default mongoose.model('Event',eventSchema)
