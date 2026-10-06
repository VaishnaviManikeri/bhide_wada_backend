import mongoose from 'mongoose'

export default function requireDatabase(_req,res,next){
  if(mongoose.connection.readyState!==1){
    return res.status(503).json({message:'Content storage is unavailable. Check the database connection.'})
  }
  return next()
}
