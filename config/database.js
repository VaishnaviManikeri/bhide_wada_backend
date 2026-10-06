import mongoose from 'mongoose'

export function validateBackendConfig(){
  const required=['MONGODB_URI','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','ADMIN_USERNAME','ADMIN_PASSWORD']
  const missing=required.filter(name=>!process.env[name])
  if(missing.length) throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  const placeholders=['replace-with-','your-cloud-name','your-cloudinary-api-key','your-cloudinary-api-secret','<username>','<password>','<cluster-host>']
  if(required.some(name=>placeholders.some(value=>process.env[name].toLowerCase().includes(value)))){
    throw new Error('Replace the example credentials in .env before starting the backend.')
  }
  if(process.env.ADMIN_PASSWORD.length<14){
    throw new Error('ADMIN_PASSWORD must be at least 14 characters long.')
  }
}

export async function connectDatabase(){
  const uri=process.env.MONGODB_URI
  if(!uri) throw new Error('MONGODB_URI is required to start the content API.')
  await mongoose.connect(uri)
  console.log('Connected to MongoDB.')
}
