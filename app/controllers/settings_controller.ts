import type { HttpContext } from '@adonisjs/core/http'
import MongoDBModels from '#models/mongodb/mongo'
import configurations_services from '#services/configuration_service'
import moment from 'moment'
import env from '#start/env'
import hash from '@adonisjs/core/services/hash'
import jwt from 'jsonwebtoken'

const settings_collections = '_collectionConfigs'

export default class SettingsController {
  async createCollectionConfig({ request, response }: HttpContext) {
    let { collectionConfigData } = request.all()
    if (!configurations_services.validateCollectionConfig(collectionConfigData)) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'Validasi konfigurasi koleksi gagal. Tidak dapat menyimpan.',
        message_en: 'Collection configuration validation failed. Cannot save.',
      })
    }
    const configDocId = collectionConfigData.name + '_config'
    try {
      const dataToSave = {
        _id: configDocId,
        ...collectionConfigData,
        created_at: moment().format(),
        updated_at: moment().format(),
      }

      await MongoDBModels.InsertOne(dataToSave, settings_collections)
      return response.created({
        status: true,
        status_code: 201,
        message_id: 'Konfigurasi koleksi berhasil disimpan.',
        message_en: 'Collection configuration saved successfully.',
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message_id:
          `Gagal menyimpan atau memperbarui konfigurasi untuk koleksi '${collectionConfigData.name}':` +
          error.message,
        message_en:
          `Failed to save or Updating configuration for collections '${collectionConfigData.name}':` +
          error.message,
      })
    }
  }
  async getCollectionConfig({ request, response }: HttpContext) {
    let { skip, paging, sort, search } = request.all()
    try {
      let query = {}
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      }
      let data = await MongoDBModels.FindWithPaging(
        query,
        skip ? Number(skip) : 0,
        paging ? Number(paging) : 5,
        sort ? sort : { _id: -1 },
        settings_collections
      )
      return response.ok({
        status: true,
        message_id: 'sukses',
        message_en: 'success',
        data: data,
        total: await MongoDBModels.GetLength({}, settings_collections),
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message: error.message,
      })
    }
  }
  async getCollectionConfigByID({ request, response }: HttpContext) {
    const id = request.param('id')
    try {
      let data = await MongoDBModels.FindOne({ _id: `${id}_config` }, settings_collections)
      return response.ok({
        status: true,
        message_id: 'sukses',
        message_en: 'success',
        data: data,
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message: error.message,
      })
    }
  }
  async updateCollectionConfig({ request, response }: HttpContext) {
    let { id, query } = request.all()
    if (!id) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'ID koleksi tidak boleh kosong.',
        message_en: 'Collection ID cannot be empty.',
      })
    }
    try {
      let data = await MongoDBModels.UpdateOne(id, query, settings_collections)

      return response.ok({
        status: true,
        message_id: 'sukses',
        message_en: 'success',
        data: data,
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message: error.message,
      })
    }
  }
  async deleteCollectionConfig({ request, response }: HttpContext) {
    let { collectionName } = request.all()
    if (!collectionName) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'koleksi tidak boleh kosong.',
        message_en: 'Collection name cannot be empty.',
      })
    }
    const configDocId = collectionName + '_config'
    try {
      await MongoDBModels.DeleteCollection(collectionName)
      const result = await MongoDBModels.DeletetOne(configDocId, {}, settings_collections)
      if (result.deletedCount > 0) {
        return response.accepted({
          status: true,
          status_code: 200,
          message_id: 'Konfigurasi koleksi ' + collectionName + ' berhasil dihapus.',
          message_en: 'Collection ' + collectionName + ' configuration deleted successfully.',
        })
      } else {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'Konfigurasi koleksi ' + collectionName + ' tidak ditemukan.',
          message_en: 'Collection ' + collectionName + ' configuration not found.',
        })
      }
    } catch (error) {
      console.log(error)

      return response.internalServerError({
        status: false,
        status_code: 500,
        message_id: 'Validasi konfigurasi koleksi gagal. Tidak dapat menyimpan.',
        message_en: 'Collection configuration validation failed. Cannot save.',
      })
    }
  }
  // GET a single document by ID for this collection, with relations
  async CollectionsWithID({ request, response }: HttpContext) {
    const collections = request.param('collections')
    const id = request.param('id')
    try {
      let config = await MongoDBModels.FindOne(
        { _id: `${collections}_config` },
        settings_collections
      )
      if (!config) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'Koleksi tidak ditemukan.',
          message_en: 'Collection not found.',
        })
      }
      const document = await configurations_services.getOneWithRelations(collections, id, config)
      if (!document) {
        return response.notFound({ message: `${collectionName} tidak ditemukan` })
      }

      return response.ok({
        status: true,
        status_code: 200,
        message_id: 'Data koleksi berhasil ditemukan.',
        message_en: 'Collection data found successfully.',
        data: document,
      })
    } catch (err) {
      if (err.name === 'BSONTypeError') {
        return response.badRequest({ message: 'ID tidak valid.' })
      }
      return response.internalServerError({
        status: false,
        status_code: 500,
        message_id: 'Validasi koleksi gagal. Tidak dapat menyimpan.',
        message_en: 'Collection validation failed. Cannot save.',
      })
    }
  }
  // GET all documents for this collection, with relations
  async Collections({ request, response }: HttpContext) {
    const collections = request.param('collections')
    let { page, limit, search } = request.all()
    page = page ? parseInt(page) : 1
    limit = limit ? parseInt(limit) : 5
    try {
      let config = await MongoDBModels.FindOne(
        { _id: `${collections}_config` },
        settings_collections
      )
      if (!config) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'Koleksi tidak ditemukan.',
          message_en: 'Collection not found.',
        })
      }
      let document = await configurations_services.getAllWithRelations(
        collections,
        config,
        page,
        limit,
        search
      )
      return response.ok({
        status: true,
        status_code: 200,
        message_id: 'Data koleksi berhasil diambil.',
        message_en: 'Collection data retrieved successfully.',
        data: document,
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message_id: 'Tidak dapat mengambil data koleksi.',
        message_en: 'Cannot get collection data.',
      })
    }
  }
  // POST a new document
  async CreateCollections({ request, response }: HttpContext) {
    const collections = request.param('collections')
    const { data } = request.all()
    try {
      let config = await MongoDBModels.FindOne(
        { _id: `${collections}_config` },
        settings_collections
      )
      if (!config) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'Koleksi tidak ditemukan.',
          message_en: 'Collection not found.',
        })
      }
      const newDocument = await configurations_services.createDocument(collections, data, config)
      return response.accepted({
        status: true,
        status_code: 201,
        message_id: 'Data koleksi berhasil dibuat.',
        message_en: 'Collection data created successfully.',
        data: newDocument,
      })
    } catch (err) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'Data koleksi gagal dibuat.' + err.message,
        message_en: 'Failed to create collection data.' + err.message,
      })
    }
  }
  async UpdateCollections({ request, response }: HttpContext) {
    try {
      const { data } = request.all()
      const id = request.param('id')
      const collections = request.param('collections')
      let config = await MongoDBModels.FindOne(
        { _id: `${collections}_config` },
        settings_collections
      )
      if (!config) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'Koleksi tidak ditemukan.',
          message_en: 'Collection not found.',
        })
      }
      const deleted = await configurations_services.updateDocument(collections, id, data, config)
      if (!deleted) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'data Koleksi tidak ditemukan.',
          message_en: 'data Collection not found.',
        })
      }
      return response.ok({
        status: true,
        status_code: 200,
        message_id: 'Data koleksi berhasil diperbarui.',
        message_en: 'Collection data updated successfully.',
        data: deleted,
      })
    } catch (err) {
      if (err.name === 'BSONTypeError') {
        return response.badRequest({
          status: false,
          status_code: 400,
          message_id: 'ID tidak valid.',
          message_en: 'ID is not valid.',
        })
      }
      return response.internalServerError({ message: err.message })
    }
  }

  // DELETE a document
  async deleteCollections({ request, response }: HttpContext) {
    try {
      const id = request.param('id')
      const collections = request.param('collections')
      const deleted = await configurations_services.deleteDocument(collections, id)
      if (!deleted) {
        return response.notFound({
          status: false,
          status_code: 404,
          message_id: 'data Koleksi tidak ditemukan.',
          message_en: 'data Collection not found.',
        })
      }
      return response.noContent()
    } catch (err) {
      if (err.name === 'BSONTypeError') {
        return response.badRequest({
          status: false,
          status_code: 400,
          message_id: 'ID tidak valid.',
          message_en: 'ID is not valid.',
        })
      }
      return response.internalServerError({ message: err.message })
    }
  }
  async UIConfigs({ request, response }) {
    let { page, limit } = request.all()
    page = page ? parseInt(page) : 1
    limit = limit ? parseInt(limit) : 0
    console.log(page, limit)

    const {
      configs: allCollectionConfigs,
      configs,
      totalCount,
      totalPages,
      currentPage,
      itemsPerPage,
    } = await configurations_services.getAllCollectionConfigs(page, limit)
    return response.ok({
      data: configs,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: currentPage,
        itemsPerPage: itemsPerPage,
      },
    })
  }

  async AuthenticationUI({ view }) {
    return view.render('authentication/index', { base_url: env.get('APP_URL') })
  }
  async AuthenticationProfile({ request, response }) {
    let username = request.user.username
    const settings_collections = '_users_systems'
    const user = await MongoDBModels.FindOne({ username: username }, settings_collections)
    if (!user) {
      return response.notFound({
        status: false,
        status_code: 404,
        message_id: 'User tidak ditemukan.',
        message_en: 'User not found.',
      })
    }
    if (!user.status) {
      return response.status(403).send({
        status: false,
        status_code: 403,
        message_id: 'User tidak aktif.',
        message_en: 'User is not active.',
      })
    }
    return response.ok({
      status: true,
      status_code: 200,
      message_id: 'User berhasil diakses.',
      message_en: 'User successfully accessed.',
      data: user,
    })
  }
  async AuthenticationLogin({ request, response }) {
    let { username, password } = request.all()
    if (!username || !password) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'Username dan password tidak boleh kosong.',
        message_en: 'Username and password cannot be empty.',
      })
    }
    const settings_collections = '_users_systems'
    const user = await MongoDBModels.FindOne({ username: username }, settings_collections)
    if (!user) {
      return response.notFound({
        status: false,
        status_code: 404,
        message_id: 'User tidak ditemukan.',
        message_en: 'User not found.',
      })
    }
    const isPasswordValid = await hash.verify(user.password, password)
    if (!isPasswordValid) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'Password tidak valid.',
        message_en: 'Password is not valid.',
      })
    }
    if (!user.status) {
      return response.status(403).send({
        status: false,
        status_code: 403,
        message_id: 'User tidak aktif.',
        message_en: 'User is not active.',
      })
    }
    const token = jwt.sign({ id: user._id, username: user.username }, 'default_secret', {
      expiresIn: '1h',
    })
    return response.ok({
      status: true,
      status_code: 200,
      message_id: 'Login berhasil.',
      message_en: 'Login success.',
      token: token,
    })
  }
  async AuthenticationRegister({ request, response }) {
    let { username, password, name, role } = request.all()
    if (!username || !password || !name) {
      return response.badRequest({
        status: false,
        status_code: 400,
        message_id: 'Username, Name dan password tidak boleh kosong.',
        message_en: 'Username, Name and password cannot be empty.',
      })
    }
    const settings_collections = '_users_systems'
    const hashedPassword = await hash.make(password)
    try {
      let find_users = await MongoDBModels.FindOne({ username: username }, settings_collections)
      if (find_users) {
        return response.status(409).send({
          status: false,
          status_code: 409,
          message_id: 'Username sudah digunakan.',
          message_en: 'Username already used.',
        })
      }
      const dataToSave = {
        name: name,
        username: username,
        password: hashedPassword,
        role: role || 'user',
        status: false,
        created_at: moment().format(),
        updated_at: moment().format(),
      }

      await MongoDBModels.InsertOne(dataToSave, settings_collections)
      return response.created({
        status: true,
        status_code: 201,
        message_id: 'User berhasil dibuat.',
        message_en: 'User created successfully.',
      })
    } catch (error) {
      return response.internalServerError({
        status: false,
        status_code: 500,
        message_id: 'Gagal membuat user.',
        message_en: 'Failed to create user.',
      })
    }
  }
  async UI({ view }) {
    return view.render('configs/index', { base_url: env.get('APP_URL') })
  }
  async UIDash({ view }) {
    return view.render('configs/dash', { base_url: env.get('APP_URL') })
  }
  async Test({ view }) {
    return view.render('test', { base_url: env.get('APP_URL') })
  }
}
