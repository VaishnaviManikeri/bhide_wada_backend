import {Router} from 'express'
import newsController from '../controllers/newsController.js'
import eventController from '../controllers/eventController.js'
import galleryController from '../controllers/galleryController.js'
import heroController from '../controllers/heroController.js'
import {createAdminContentRoutes,createPublicContentRoutes} from './createContentRoutes.js'

const router=Router()

router.use('/news',createPublicContentRoutes(newsController))
router.use('/events',createPublicContentRoutes(eventController))
router.use('/gallery',createPublicContentRoutes(galleryController))
router.use('/hero',createPublicContentRoutes(heroController))
router.use('/admin/news',createAdminContentRoutes(newsController))
router.use('/admin/events',createAdminContentRoutes(eventController))
router.use('/admin/gallery',createAdminContentRoutes(galleryController))
router.use('/admin/hero',createAdminContentRoutes(heroController))

export default router
