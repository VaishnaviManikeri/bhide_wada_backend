import multer from 'multer'
import {randomUUID} from 'node:crypto'
import {mkdir} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const allowedImageTypes=new Set(['image/jpeg','image/png','image/webp','image/gif'])
const uploadDirectory=join(tmpdir(),'bhide-wada-uploads')

const upload=multer({
  storage:multer.diskStorage({
    destination(_req,_file,callback){
      mkdir(uploadDirectory,{recursive:true},error=>callback(error,uploadDirectory))
    },
    filename(_req,file,callback){
      const extension=file.originalname.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0]||''
      callback(null,`${randomUUID()}${extension}`)
    }
  }),
  limits:{files:1},
  fileFilter(_req,file,callback){
    if(!allowedImageTypes.has(file.mimetype)&&!file.mimetype.startsWith('video/')){
      const error=new Error('Upload a supported image or video file.')
      error.statusCode=400
      callback(error)
      return
    }
    callback(null,true)
  }
})

export default upload
