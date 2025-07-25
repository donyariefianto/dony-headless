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

router.get('/', '#controllers/settings_controller.UIdash')
router.get('/login', '#controllers/settings_controller.AuthenticationUI')

router
  .group(() => {
    // API CRUD COLLECTION
    router
      .group(() => {
        router.post('/create', '#controllers/settings_controller.createCollectionConfig')
        router.get('/list', '#controllers/settings_controller.getCollectionListConfig')
        router.get('/read', '#controllers/settings_controller.getCollectionConfig')
        router.get('/read/:id', '#controllers/settings_controller.getCollectionConfigByID')
        router.put('/update', '#controllers/settings_controller.updateCollectionConfig')
        router.delete('/delete', '#controllers/settings_controller.deleteCollectionConfig')
      })
      .prefix('collection')

    // API CRUD DASHBOARD
    router
      .group(() => {
        router.get('/list', '#controllers/settings_controller.getDashboardListConfig')
        router.get('/read/:id', '#controllers/settings_controller.getDashboardConfigByID')
      })
      .prefix('/dashboard')

    // API CRUD FORMBUILDER
    router
      .group(() => {
        router.get('/list', '#controllers/settings_controller.getFormBuilderListConfig')
        router.get('/read/:id', '#controllers/settings_controller.getFormBuilderConfigByID')
      })
      .prefix('/formbuilder')
    
    // API CRUD FLOW MANAGER
    router
    .group(() => {
      router.get('/list', '#controllers/settings_controller.getFlowListConfig')
      router.get('/read/:id', '#controllers/settings_controller.getFlowConfigByID')
    })
    .prefix('/flow-manager')
  })
  .prefix('/configuration')

router
  .group(() => {
    router.get('/', '#controllers/settings_controller.UI')
    router.get('/dash', '#controllers/settings_controller.UIDash')
    router.get('/dash2', '#controllers/settings_controller.UIDashV2')
    router.get('/flow-manager', '#controllers/settings_controller.UIFlowManager')
    router.get('/dynamic-form', '#controllers/settings_controller.UIDynamicsForm')
    router.get('/test', '#controllers/settings_controller.Test')
    router.get('/v2', '#controllers/settings_controller.UIv2')
  })
  .prefix('/manages')

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

router.post('/beacon', '#controllers/settings_controller.Beacon')
