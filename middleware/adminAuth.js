const sessions=new Map()
const sessionCookie='bhide_admin_session'
const sessionLifetime=8*60*60*1000

function readCookie(req,name){
  const cookies=req.headers.cookie?.split(';')||[]
  const cookie=cookies.find(value=>value.trim().startsWith(`${name}=`))
  return cookie?cookie.trim().slice(name.length+1):''
}

export function setAdminSession(req,res,token){
  const expiresAt=Date.now()+sessionLifetime
  sessions.set(token,expiresAt)
  res.cookie(sessionCookie,token,{
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite:process.env.NODE_ENV==='production'?'none':'strict',
    path:'/',
    maxAge:sessionLifetime
  })
}

export function clearAdminSession(req,res){
  const token=readCookie(req,sessionCookie)
  if(token) sessions.delete(token)
  res.clearCookie(sessionCookie,{
    httpOnly:true,
    secure:process.env.NODE_ENV==='production',
    sameSite:process.env.NODE_ENV==='production'?'none':'strict',
    path:'/'
  })
}

export function requireAdmin(req,res,next){
  const token=readCookie(req,sessionCookie)
  const expiresAt=sessions.get(token)
  if(!expiresAt||expiresAt<=Date.now()){
    if(token) sessions.delete(token)
    return res.status(401).json({message:'Admin login is required.'})
  }
  return next()
}

export function isAdminAuthenticated(req){
  const token=readCookie(req,sessionCookie)
  const expiresAt=sessions.get(token)
  if(!expiresAt) return false
  if(expiresAt<=Date.now()){
    sessions.delete(token)
    return false
  }
  return true
}
