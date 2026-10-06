export default function requireTrustedOrigin(req,res,next){
  const origin=req.get('origin')
  const configuredOrigin=process.env.CLIENT_ORIGIN||'http://localhost:5173'
  let allowedOrigin
  try{allowedOrigin=new URL(configuredOrigin).origin}
  catch{return res.status(500).json({message:'The server frontend origin is misconfigured.'})}
  if(!origin||origin!==allowedOrigin){
    return res.status(403).json({message:'This request did not come from the configured website.'})
  }
  return next()
}
