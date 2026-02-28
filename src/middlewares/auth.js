const supabase = require('../config/supabase')

// Middleware: Authorization header'dan Bearer token alır, Supabase ile user'ı alır
module.exports = async function auth(req, res, next){
  try{
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    if(!token){ req.user = null; return next() }

    // Supabase ile token'dan kullanıcıyı al
    const { data, error } = await supabase.auth.getUser(token)
    if(error) { req.user = null; return next() }

    req.user = data?.user || null
    return next()
  }catch(err){
    req.user = null
    return next()
  }
}
