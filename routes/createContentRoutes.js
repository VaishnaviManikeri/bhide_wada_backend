import {Router} from 'express'
import {requireAdmin} from '../middleware/adminAuth.js'
import upload from '../middleware/uploadMedia.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireTrustedOrigin from '../middleware/requireTrustedOrigin.js'

export function createPublicContentRoutes(controller){
  const router=Router()
  router.get('/',requireDatabase,controller.publicList||controller.list)
  return router
}

export function createAdminContentRoutes(controller){
  const router=Router()
  router.use(requireAdmin,requireDatabase)
  router.get('/',controller.list)
  router.post('/',requireTrustedOrigin,upload.single('media'),controller.create)
  router.put('/:id',requireTrustedOrigin,upload.single('media'),controller.update)
  router.delete('/:id',requireTrustedOrigin,controller.remove)
  return router
}
