import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import {appendFile,mkdir} from 'node:fs/promises'
import {dirname,join} from 'node:path'
import {randomUUID} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {connectDatabase,validateBackendConfig} from './config/database.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import contentRoutes from './routes/contentRoutes.js'
import {errorHandler} from './middleware/errorHandler.js'

export const app=express()
dotenv.config({path:join(dirname(fileURLToPath(import.meta.url)),'.env')})
const port=process.env.PORT||5038

app.use(cors({
  origin:[
    process.env.CLIENT_ORIGIN||'http://localhost:5173',
    'https://phulewadarashtriyasmarak.com',
  ],
  methods:['GET','POST','PUT','DELETE','OPTIONS'],
  credentials:true
}))
app.use(express.json({limit:'1mb'}))

app.get('/',(_req,res)=>res.json({
  service:'Bhide Wada API',
  status:'ok',
  health:'/api/health'
}))
app.get('/api/health',(_req,res)=>res.json({status:'ok'}))
app.use('/api/admin',adminAuthRoutes)
app.use('/api',contentRoutes)

const demoBonafideRequests=[
  {id:4,studentName:'Gaurav Hajare',admissionNo:'STU-6197-2026-163092',department:'MBA',submittedAt:'31 Aug 2026',reason:'FOR BUS PASS',status:'PRINCIPAL_PENDING'}
]

app.get('/api/bonafide',(_req,res)=>{
  res.json({requests:demoBonafideRequests.filter(request=>request.status==='PRINCIPAL_PENDING')})
})

app.post('/api/bonafide/:id/approve',async(req,res,next)=>{
  try{
    const id=Number(req.params.id)
    const request=demoBonafideRequests.find(item=>item.id===id)
    if(!request) return res.status(404).json({message:'Bonafide request not found.'})
    if(request.status!=='PRINCIPAL_PENDING'){
      return res.status(409).json({message:'This bonafide request has already been processed.'})
    }
    request.status='APPROVED'
    request.approvedBy=req.body?.approvedBy?.trim()||'Principal'
    request.approvedAt=new Date().toISOString()
    await mkdir(join(process.cwd(),'data'),{recursive:true})
    await appendFile(join(process.cwd(),'data','bonafide-approvals.ndjson'),`${JSON.stringify(request)}\n`)
    return res.json({request,message:'Bonafide request approved successfully.'})
  }catch(error){return next(error)}
})

app.post('/api/enquiries',async(req,res,next)=>{
  try{
    const {name,phone,email='',subject='',message=''}=req.body??{}
    if(!name?.trim()||!phone?.trim()){
      return res.status(400).json({message:'कृपया आपले नाव आणि मोबाईल क्रमांक भरा.'})
    }
    const entry={
      id:randomUUID(),
      name:name.trim(),phone:phone.trim(),email:email.trim(),subject:subject.trim(),message:message.trim(),
      receivedAt:new Date().toISOString()
    }
    await mkdir(join(process.cwd(),'data'),{recursive:true})
    await appendFile(join(process.cwd(),'data','enquiries.ndjson'),`${JSON.stringify(entry)}\n`)
    return res.status(201).json({message:'धन्यवाद! आपली विनंती समितीकडे पाठवली आहे.'})
  }catch(error){return next(error)}
})

app.use(errorHandler)

if(process.env.NODE_ENV!=='test'){
  try{
    validateBackendConfig()
    await connectDatabase()
    app.listen(port,()=>console.log(`Bhide Wada API listening on http://localhost:${port}`))
  }catch(error){
    console.error('Unable to start the backend:',error.message)
    process.exitCode=1
  }
}
