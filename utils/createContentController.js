import {deleteMedia,removeTemporaryMedia,uploadMedia,uploadMediaFromUrl} from './cloudinary.js'

export function createContentController({Model,fields,mediaRequired=false,remoteMediaField=null,remoteMediaTypeField=null,publicFilter={},mediaTypes=['image','video'],sort={createdAt:-1}}){
  const list=async(_req,res,next,filter={})=>{
    try{
      const items=await Model.find(filter).sort(sort).lean()
      res.json({items})
    }catch(error){next(error)}
  }
  const listAll=(req,res,next)=>list(req,res,next)
  const listPublic=(req,res,next)=>list(req,res,next,publicFilter)

  const create=async(req,res,next)=>{
    let uploaded
    try{
      if(req.file&&remoteMediaField&&req.body[remoteMediaField]){
        return res.status(400).json({message:'Choose either a file upload or a media URL, not both.'})
      }
      if(remoteMediaTypeField&&req.body[remoteMediaTypeField]&&!['image','video'].includes(req.body[remoteMediaTypeField])){
        return res.status(400).json({message:'Choose image or video as the URL media type.'})
      }
      if(req.file) uploaded=await uploadMedia(req.file)
      else if(remoteMediaField&&req.body[remoteMediaField]){
        uploaded=await uploadMediaFromUrl(req.body[remoteMediaField],req.body[remoteMediaTypeField]||'auto')
      }
      if(uploaded&&!mediaTypes.includes(uploaded.resourceType)){
        const error=new Error(`This page only accepts ${mediaTypes.join(' and ')} media.`)
        error.statusCode=400
        throw error
      }
      if(mediaRequired&&!uploaded) return res.status(400).json({message:'A media file is required.'})
      const values={}
      for(const field of fields){
        if(req.body[field]!==undefined) values[field]=req.body[field]
      }
      if(uploaded){
        values.mediaUrl=uploaded.url
        values.mediaPublicId=uploaded.publicId
        values.mediaResourceType=uploaded.resourceType
        values.mediaProvider=uploaded.provider||'cloudinary'
      }
      const item=await Model.create(values)
      res.status(201).json({item})
    }catch(error){
      if(uploaded){
        try{await deleteMedia(uploaded.publicId,uploaded.resourceType)}
        catch(cleanupError){console.error('Cloudinary cleanup failed after create error:',cleanupError)}
      }
      next(error)
    }finally{
      try{await removeTemporaryMedia(req.file)}
      catch(error){console.error('Unable to remove temporary media upload:',error)}
    }
  }

  const update=async(req,res,next)=>{
    let uploaded
    try{
      const item=await Model.findById(req.params.id)
      if(!item) return res.status(404).json({message:'Content was not found.'})
      if(req.file&&remoteMediaField&&req.body[remoteMediaField]){
        return res.status(400).json({message:'Choose either a file upload or a media URL, not both.'})
      }
      if(remoteMediaTypeField&&req.body[remoteMediaTypeField]&&!['image','video'].includes(req.body[remoteMediaTypeField])){
        return res.status(400).json({message:'Choose image or video as the URL media type.'})
      }
      if(req.file) uploaded=await uploadMedia(req.file)
      else if(remoteMediaField&&req.body[remoteMediaField]){
        uploaded=await uploadMediaFromUrl(req.body[remoteMediaField],req.body[remoteMediaTypeField]||'auto')
      }
      if(uploaded&&!mediaTypes.includes(uploaded.resourceType)){
        const error=new Error(`This page only accepts ${mediaTypes.join(' and ')} media.`)
        error.statusCode=400
        throw error
      }
      for(const field of fields){
        if(req.body[field]!==undefined) item[field]=req.body[field]
      }
      const previousMedia=uploaded&&item.mediaPublicId
        ?{publicId:item.mediaPublicId,resourceType:item.mediaResourceType}
        :null
      if(uploaded){
        item.mediaUrl=uploaded.url
        item.mediaPublicId=uploaded.publicId
        item.mediaResourceType=uploaded.resourceType
        item.mediaProvider=uploaded.provider||'cloudinary'
      }
      await item.save()
      let mediaCleanupWarning=''
      if(previousMedia){
        try{await deleteMedia(previousMedia.publicId,previousMedia.resourceType)}
        catch(error){
          console.error('Cloudinary cleanup failed after content update:',error)
          mediaCleanupWarning='The record was updated, but its previous Cloudinary file could not be removed.'
        }
      }
      res.json({item,mediaCleanupWarning})
    }catch(error){
      if(uploaded){
        try{await deleteMedia(uploaded.publicId,uploaded.resourceType)}
        catch(cleanupError){console.error('Cloudinary cleanup failed after update error:',cleanupError)}
      }
      next(error)
    }finally{
      try{await removeTemporaryMedia(req.file)}
      catch(error){console.error('Unable to remove temporary media upload:',error)}
    }
  }

  const remove=async(req,res,next)=>{
    try{
      const item=await Model.findById(req.params.id)
      if(!item) return res.status(404).json({message:'Content was not found.'})
      await item.deleteOne()
      let mediaCleanupWarning=''
      if(item.mediaPublicId){
        try{await deleteMedia(item.mediaPublicId,item.mediaResourceType)}
        catch(error){
          console.error('Cloudinary cleanup failed after content deletion:',error)
          mediaCleanupWarning='The record was deleted, but its Cloudinary file could not be removed.'
        }
      }
      res.json({message:'Content deleted.',mediaCleanupWarning})
    }catch(error){next(error)}
  }

  return {list:listAll,publicList:listPublic,create,update,remove}
}
