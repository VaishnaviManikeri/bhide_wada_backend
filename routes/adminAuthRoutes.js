import {Router} from 'express'
import {login,logout,session} from '../controllers/adminController.js'
import {requireAdmin} from '../middleware/adminAuth.js'
import requireTrustedOrigin from '../middleware/requireTrustedOrigin.js'

const router=Router()

router.post('/login',requireTrustedOrigin,login)
router.get('/session',session)
router.post('/logout',requireTrustedOrigin,requireAdmin,logout)

export default router
