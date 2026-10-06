import {randomBytes,createHash,timingSafeEqual} from 'node:crypto'
import {clearAdminSession,isAdminAuthenticated,setAdminSession} from '../middleware/adminAuth.js'

const failedLogins=new Map()
const loginWindow=15*60*1000
const maxAttempts=5

function matchesSecret(received,expected){
  const receivedHash=createHash('sha256').update(received).digest()
  const expectedHash=createHash('sha256').update(expected).digest()
  return timingSafeEqual(receivedHash,expectedHash)
}

function clientKey(req){return req.ip||req.socket.remoteAddress||'unknown'}

export function login(req,res){
  const key=clientKey(req)
  const now=Date.now()
  const attempts=failedLogins.get(key)
  if(attempts&&now-attempts.startedAt<loginWindow&&attempts.count>=maxAttempts){
    return res.status(429).json({message:'Too many login attempts. Try again in 15 minutes.'})
  }
  if(attempts&&now-attempts.startedAt>=loginWindow) failedLogins.delete(key)
  const username=String(req.body?.username||'')
  const password=String(req.body?.password||'')
  const expectedUsername=process.env.ADMIN_USERNAME||''
  const expectedPassword=process.env.ADMIN_PASSWORD||''
  if(!expectedUsername||!expectedPassword){
    return res.status(503).json({message:'Admin credentials are not configured on the server.'})
  }
  const usernameMatches=matchesSecret(username,expectedUsername)
  const passwordMatches=matchesSecret(password,expectedPassword)
  if(!usernameMatches||!passwordMatches){
    const current=failedLogins.get(key)
    failedLogins.set(key,{
      startedAt:current&&now-current.startedAt<loginWindow?current.startedAt:now,
      count:current&&now-current.startedAt<loginWindow?current.count+1:1
    })
    return res.status(401).json({message:'Invalid username or password.'})
  }
  failedLogins.delete(key)
  const token=randomBytes(32).toString('hex')
  setAdminSession(req,res,token)
  return res.json({authenticated:true})
}

export function session(req,res){
  return res.json({authenticated:isAdminAuthenticated(req)})
}

export function logout(req,res){
  clearAdminSession(req,res)
  return res.json({authenticated:false})
}
