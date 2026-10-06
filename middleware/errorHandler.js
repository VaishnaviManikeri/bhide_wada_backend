export function errorHandler(error,_req,res,_next){
  if(error instanceof SyntaxError&&error.status===400&&'body' in error){
    return res.status(400).json({message:'The request body contains invalid JSON.'})
  }
  if(error?.name==='ValidationError'||error?.name==='CastError'){
    return res.status(400).json({message:error.message})
  }
  if(error?.code===11000){
    return res.status(409).json({message:'A record with that value already exists.'})
  }
  if(error?.name==='MulterError'){
    const message=error.code==='LIMIT_FILE_SIZE'?'Media files must be 50 MB or smaller.':'Unable to process the uploaded file.'
    return res.status(400).json({message})
  }
  if(error?.statusCode){
    return res.status(error.statusCode).json({message:error.message})
  }
  console.error(error)
  return res.status(500).json({message:'The server could not complete the request.'})
}
