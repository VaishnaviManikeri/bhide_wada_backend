import {v2 as cloudinary} from 'cloudinary'
import {createReadStream} from 'node:fs'
import {open,unlink} from 'node:fs/promises'

function configureCloudinary(){
  if(!process.env.CLOUDINARY_CLOUD_NAME||!process.env.CLOUDINARY_API_KEY||!process.env.CLOUDINARY_API_SECRET){
    throw new Error('Cloudinary configuration is missing.')
  }
  cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
    secure:true
  })
}

async function readFileHeader(path){
  const file=await open(path,'r')
  try{
    const buffer=Buffer.alloc(12)
    const {bytesRead}=await file.read(buffer,0,buffer.length,0)
    return buffer.subarray(0,bytesRead)
  }finally{
    await file.close()
  }
}

function uploadStream(source){
  return new Promise((resolve,reject)=>{
    const destination=cloudinary.uploader.upload_stream({resource_type:'auto',folder:'bhide-wada'},(error,result)=>{
      if(error){reject(error);return}
      if(!result){reject(new Error('Cloudinary did not return an uploaded asset.'));return}
      if(!['image','video'].includes(result.resource_type)){
        const error=new Error('Only image and video files are supported.')
        deleteMedia(result.public_id,result.resource_type)
          .catch(cleanupError=>console.error('Unable to remove unsupported Cloudinary upload:',cleanupError))
        reject(error)
        return
      }
      resolve({url:result.secure_url,publicId:result.public_id,resourceType:result.resource_type})
    })
    source.once('error',reject)
    destination.once('error',reject)
    source.pipe(destination)
  })
}

function youtubeEmbed(value){
  const source=new URL(value)
  if(source.protocol!=='https:'||source.username||source.password) return null
  const hostname=source.hostname.toLowerCase().replace(/^www\./,'')
  if(!['youtube.com','m.youtube.com','music.youtube.com','youtu.be','youtube-nocookie.com'].includes(hostname)) return null
  let id=''
  if(hostname==='youtu.be') id=source.pathname.split('/').filter(Boolean)[0]||''
  else if(source.pathname==='/watch') id=source.searchParams.get('v')||''
  else id=source.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]||''
  if(!/^[a-zA-Z0-9_-]{11}$/.test(id)){
    const error=new Error('Enter a valid YouTube video link.')
    error.statusCode=400
    throw error
  }
  return {
    url:`https://www.youtube-nocookie.com/embed/${id}`,
    publicId:'',
    resourceType:'video',
    provider:'youtube'
  }
}

export async function uploadMedia(file){
  configureCloudinary()
  const header=await readFileHeader(file.path)
  const validImage={
    'image/jpeg':header[0]===0xff&&header[1]===0xd8&&header[2]===0xff,
    'image/png':header.subarray(0,4).equals(Buffer.from([0x89,0x50,0x4e,0x47])),
    'image/gif':['GIF87a','GIF89a'].includes(header.subarray(0,6).toString()),
    'image/webp':header.subarray(0,4).toString()==='RIFF'&&header.subarray(8,12).toString()==='WEBP'
  }
  const validVideo=file.mimetype.startsWith('video/')
  if(!validImage[file.mimetype]&&!validVideo){
    const error=new Error('The uploaded file contents do not match a supported image or video type.')
    error.statusCode=400
    throw error
  }
  return uploadStream(createReadStream(file.path))
}

export async function uploadMediaFromUrl(value,mediaType='auto'){
  configureCloudinary()
  if(!['auto','image','video'].includes(mediaType)){
    const error=new Error('Choose whether the URL contains an image or video.')
    error.statusCode=400
    throw error
  }
  let source
  try{source=new URL(value)}
  catch{
    const error=new Error('Enter a valid publicly accessible HTTPS image or video URL.')
    error.statusCode=400
    throw error
  }
  if(source.protocol!=='https:'||source.username||source.password){
    const error=new Error('Media URLs must use HTTPS and cannot include embedded credentials.')
    error.statusCode=400
    throw error
  }
  const youtube=youtubeEmbed(source.href)
  if(youtube){
    if(mediaType==='image'){
      const error=new Error('YouTube links are videos. Select Video as the media type.')
      error.statusCode=400
      throw error
    }
    return youtube
  }
  try{
    const result=await cloudinary.uploader.upload(source.href,{
      resource_type:mediaType,
      folder:'bhide-wada'
    })
    if(!['image','video'].includes(result.resource_type)){
      await deleteMedia(result.public_id,result.resource_type)
      const error=new Error('The URL must point to a supported image or video.')
      error.statusCode=400
      throw error
    }
    if(mediaType!=='auto'&&result.resource_type!==mediaType){
      await deleteMedia(result.public_id,result.resource_type)
      const error=new Error(`The URL did not contain the selected ${mediaType}.`)
      error.statusCode=400
      throw error
    }
    return {url:result.secure_url,publicId:result.public_id,resourceType:result.resource_type,provider:'cloudinary'}
  }catch(error){
    if(error.statusCode) throw error
    console.error('Cloudinary could not import gallery media URL:',error.message)
    const wrapped=new Error(
      error.http_code===413
        ?'Cloudinary rejected this video because it exceeds the upload limit for your account. Check your Cloudinary plan limits.'
        :'Cloudinary could not import this URL. Use a direct, publicly accessible HTTPS media-file URL, not a video player or streaming page, and verify your Cloudinary plan limits.'
    )
    wrapped.statusCode=error.http_code===413?413:502
    throw wrapped
  }
}

export async function removeTemporaryMedia(file){
  if(!file?.path) return
  try{await unlink(file.path)}
  catch(error){
    if(error.code!=='ENOENT') throw error
  }
}

export async function deleteMedia(publicId,resourceType='image'){
  if(!publicId) return
  await cloudinary.uploader.destroy(publicId,{resource_type:resourceType})
}
