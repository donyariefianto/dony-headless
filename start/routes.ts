/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.post('/create', '#controllers/settings_controller.createCollectionConfig')
    router.get('/read', '#controllers/settings_controller.getCollectionConfig')
    router.get('/read/:id', '#controllers/settings_controller.getCollectionConfigByID')
    router.put('/update', '#controllers/settings_controller.updateCollectionConfig')
    router.delete('/delete', '#controllers/settings_controller.deleteCollectionConfig')
  })
  .prefix('/configuration')
router.get('/', '#controllers/settings_controller.UIdash')
router
  .group(() => {
    router.get('/', '#controllers/settings_controller.UI')
    router.get('/dash', '#controllers/settings_controller.UIDash')
  })
  .prefix('/manages')

router.get('/login', '#controllers/settings_controller.AuthenticationUI')
router
  .group(() => {
    router.post('/login', '#controllers/settings_controller.AuthenticationLogin')
    router.post('/register', '#controllers/settings_controller.AuthenticationRegister')
    router
      .post('/profile', '#controllers/settings_controller.AuthenticationProfile')
      .use(middleware.authentication())
    router.get('/configs', '#controllers/settings_controller.UIConfigs')
    router.get('/ui-configs', '#controllers/settings_controller.UIConfigs')
    // DYNAMIC ROUTER
    router.post('/:collections', '#controllers/settings_controller.CreateCollections')
    router.get('/:collections', '#controllers/settings_controller.Collections')
    router.get('/:collections/:id', '#controllers/settings_controller.CollectionsWithID')
    router.put('/:collections/:id', '#controllers/settings_controller.UpdateCollections')
    router.delete('/:collections/:id', '#controllers/settings_controller.deleteCollections')
  })
  .prefix('/api')
