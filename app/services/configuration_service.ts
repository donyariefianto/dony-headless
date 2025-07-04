import { database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'

export class ConfigurationService {
  /**
   * Memvalidasi struktur dasar konfigurasi untuk satu koleksi.
   * @param {object} collectionConfig - Objek konfigurasi satu koleksi yang akan divalidasi.
   * @returns {boolean} True jika valid, false jika tidak.
   */
  public validateCollectionConfig(collectionConfig) {
    if (!collectionConfig || typeof collectionConfig !== 'object') {
      console.error('Konfigurasi koleksi harus berupa objek.')
      return false
    }
    if (!collectionConfig.name || typeof collectionConfig.name !== 'string') {
      console.error(`Koleksi memerlukan 'name' (string): ${JSON.stringify(collectionConfig)}`)
      return false
    }
    if (!Array.isArray(collectionConfig.fields)) {
      console.error(`Koleksi '${collectionConfig.name}' memerlukan 'fields' (array).`)
      return false
    }
    // TODO: Tambahkan validasi lebih lanjut untuk setiap field dan relasi
    // - Memastikan 'type' field adalah salah satu dari tipe yang valid (String, Number, ObjectId, Date, Boolean, Object, Array)
    // - Untuk relasi, pastikan 'type', 'foreignCollection', 'localField', 'foreignField' ada dan valid.
    return true
  }

  /**
   * Membangun pipeline agregasi Mongodatabase untuk melakukan lookup relasi.
   * Fungsi ini sangat penting untuk mengambil data yang berelasi.
   * Ini dirancang untuk bekerja dengan konfigurasi relasi yang Anda miliki.
   *
   * Catatan: Implementasi ini mengasumsikan relasi:
   * - One-to-Many / Many-to-One: Direferensikan oleh ObjectId di satu sisi.
   * - Many-to-Many (via embedded array): Referensi ObjectId ada di dalam array objek.
   *
   * @param {string} currentCollectionName - Nama koleksi yang sedang dikueri (koleksi "utama").
   * @param {Array<object>} collectionConfigFields - Array definisi field dari konfigurasi koleksi saat ini.
   * @param {Array<object>} collectionConfigRelations - Array definisi relasi dari konfigurasi koleksi saat ini.
   * @returns {Array<object>} Sebuah array dari tahap-tahap pipeline agregasi ($lookup, $unwind, $group, dll).
   */
  // public buildRelationLookupPipeline(
  //   currentCollectionName,
  //   collectionConfigFields,
  //   collectionConfigRelations
  // ) {
  //   let pipelineStages = []

  //   // 1. Handle relasi Many-to-One yang didefinisikan di `fields`
  //   // (misal: userId di collection 'orders' merujuk ke '_id' di 'users')
  //   collectionConfigFields.forEach((field) => {
  //     if (
  //       field.relation &&
  //       field.relation.type === 'many-to-one' &&
  //       field.relation.targetCollection
  //     ) {
  //       pipelineStages.push(
  //         {
  //           $lookup: {
  //             from: field.relation.targetCollection, // Koleksi target relasi
  //             localField: field.name, // Field di koleksi saat ini (misal: 'userId')
  //             foreignField: '_id', // Field di koleksi target (biasanya '_id')
  //             as: `${field.name}Details`, // Nama field untuk hasil lookup (misal: 'userIdDetails')
  //           },
  //         },
  //         {
  //           // $unwind untuk mengubah array hasil lookup menjadi objek tunggal
  //           // preserveNullAndEmptyArrays: true memastikan dokumen utama tetap ada meskipun tidak ada match
  //           $unwind: { path: `$${field.name}Details`, preserveNullAndEmptyArrays: true },
  //         }
  //       )
  //     }
  //   })

  //   // 2. Handle relasi Many-to-Many via embedded array dengan referensi ObjectId
  //   // (misal: 'items' di 'orders' berisi { productId: ObjectId, quantity: Number })
  //   const embeddedArrayField = collectionConfigFields.find(
  //     (field) =>
  //       field.type === 'Array' &&
  //       field.items &&
  //       field.items.type === 'Object' &&
  //       field.items.fields &&
  //       field.items.fields.some(
  //         (f) => f.type === 'ObjectId' && f.relation && f.relation.type === 'many-to-one'
  //       )
  //   )

  //   if (embeddedArrayField) {
  //     const productIdFieldInEmbedded = embeddedArrayField.items.fields.find(
  //       (f) => f.type === 'ObjectId' && f.relation && f.relation.type === 'many-to-one'
  //     )

  //     if (productIdFieldInEmbedded) {
  //       pipelineStages.push(
  //         { $unwind: `$${embeddedArrayField.name}` }, // Unwind the main embedded array (e.g., "$items")
  //         {
  //           $lookup: {
  //             from: productIdFieldInEmbedded.relation.targetCollection, // Target collection (e.g., 'products')
  //             localField: `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}`, // Field dalam embedded document (e.g., "items.productId")
  //             foreignField: '_id',
  //             as: `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details`, // Tempatkan detail di dalam setiap item
  //           },
  //         },
  //         {
  //           // $unwind lagi untuk mengubah array hasil lookup menjadi objek tunggal
  //           $unwind: {
  //             path: `$${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details`,
  //             preserveNullAndEmptyArrays: true,
  //           },
  //         },
  //         {
  //           // Rekelompokkan kembali dokumen setelah unwind
  //           $group: {
  //             _id: '$_id', // Kelompokkan berdasarkan ID dokumen utama
  //             // $first untuk mengambil nilai field dari dokumen pertama dalam grup (original document)
  //             ...Object.fromEntries(
  //               collectionConfigFields
  //                 .filter((f) => f.name !== embeddedArrayField.name) // Jangan masukkan field array yang di-unwind
  //                 .map((f) => [f.name, { $first: `$${f.name}` }])
  //             ),
  //             // $push untuk mengumpulkan kembali item array yang telah diproses
  //             [embeddedArrayField.name]: { $push: `$${embeddedArrayField.name}` },
  //           },
  //         }
  //       )
  //     }
  //   }

  //   // 3. Handle relasi One-to-Many yang didefinisikan di `relations` array di level collection
  //   // (misal: 'users' punya 'orders', kita ingin melihat semua order dari user)
  //   const oneToManyRelations = collectionConfigRelations.filter(
  //     (rel) => rel.type === 'one-to-many' && rel.localCollection === currentCollectionName
  //   )

  //   oneToManyRelations.forEach((rel) => {
  //     pipelineStages.push(
  //       {
  //         $lookup: {
  //           from: rel.foreignCollection, // Koleksi target (e.g., 'orders')
  //           localField: rel.localField, // Field di koleksi saat ini (e.g., '_id' dari 'users')
  //           foreignField: rel.foreignField, // Field di koleksi target yang merujuk (e.g., 'userId' di 'orders')
  //           as: rel.foreignCollection, // Nama field untuk array dokumen yang berelasi (e.g., 'orders')
  //         },
  //       }
  //       // Kita tidak $unwind di sini karena ingin mendapatkan array dokumen
  //     )
  //   })

  //   return pipelineStages
  // }

  /**
   * Membangun pipeline agregasi MongoDB untuk melakukan lookup relasi.
   * Dapat menyertakan tahap $match untuk pencarian opsional.
   *
   * @param {string} currentCollectionName - Nama koleksi utama.
   * @param {Array<Object>} collectionConfigFields - Array konfigurasi field dari koleksi saat ini.
   * @param {Array<Object>} collectionConfigRelations - Array konfigurasi relasi dari koleksi saat ini.
   * @param {string} [searchQuery] - Query pencarian opsional. Jika disediakan, pipeline akan menyertakan tahap $match.
   * @returns {Array<Object>} - Array tahap-tahap pipeline agregasi MongoDB.
   */
  public buildRelationLookupPipeline(
    currentCollectionName,
    collectionConfigFields, // <-- Ini yang akan kita manfaatkan!
    collectionConfigRelations,
    searchQuery
  ) {
    let pipelineStages = []
    let searchableFieldPaths = [] // Array untuk menyimpan jalur field yang bisa dicari

    // --- Strategi untuk mendapatkan field yang bisa dicari dari konfigurasi ---
    // Fungsi helper untuk mendapatkan nama field bertipe string/text dari sebuah konfigurasi field array
    const getStringSearchableFields = (fieldsArray) => {
      return fieldsArray.filter((f) => f.type === 'string' || f.type === 'text').map((f) => f.name)
    }

    // 1. Handle relasi Many-to-One yang didefinisikan di `fields`
    // Gunakan collectionConfigFields untuk menambahkan field dari koleksi utama
    getStringSearchableFields(collectionConfigFields).forEach((fieldName) => {
      searchableFieldPaths.push(fieldName)
    })

    collectionConfigFields.forEach((field) => {
      if (
        field.relation &&
        field.relation.type === 'many-to-one' &&
        field.relation.targetCollection
      ) {
        pipelineStages.push(
          {
            $lookup: {
              from: field.relation.targetCollection,
              localField: field.name,
              foreignField: '_id',
              as: `${field.name}Details`,
            },
          },
          {
            $unwind: { path: `$${field.name}Details`, preserveNullAndEmptyArrays: true },
          }
        )
        // Tambahkan asumsi field yang bisa dicari dari koleksi yang direlasikan
        // Karena kita tidak punya config target, ini masih berupa asumsi.
        // Jika Anda punya collectionConfigsMap, Anda akan pakai getStringSearchableFields(targetConfig) di sini.
        searchableFieldPaths.push(`${field.name}Details.name`)
        searchableFieldPaths.push(`${field.name}Details.displayName`)
        searchableFieldPaths.push(`${field.name}Details.title`)
        searchableFieldPaths.push(`${field.name}Details.email`)
        searchableFieldPaths.push(`${field.name}Details.description`)
      }
    })

    // 2. Handle relasi Many-to-Many via embedded array dengan referensi ObjectId
    const embeddedArrayField = collectionConfigFields.find(
      (field) =>
        field.type === 'Array' &&
        field.items &&
        field.items.type === 'Object' &&
        field.items.fields &&
        field.items.fields.some(
          (f) => f.type === 'ObjectId' && f.relation && f.relation.type === 'many-to-one'
        )
    )

    if (embeddedArrayField) {
      const productIdFieldInEmbedded = embeddedArrayField.items.fields.find(
        (f) => f.type === 'ObjectId' && f.relation && f.relation.type === 'many-to-one'
      )

      if (productIdFieldInEmbedded) {
        pipelineStages.push(
          { $unwind: `$${embeddedArrayField.name}` },
          {
            $lookup: {
              from: productIdFieldInEmbedded.relation.targetCollection,
              localField: `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}`,
              foreignField: '_id',
              as: `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details`,
            },
          },
          {
            $unwind: {
              path: `$${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details`,
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $group: {
              _id: '$_id',
              ...Object.fromEntries(
                collectionConfigFields
                  .filter((f) => f.name !== embeddedArrayField.name)
                  .map((f) => [f.name, { $first: `$${f.name}` }])
              ),
              [embeddedArrayField.name]: { $push: `$${embeddedArrayField.name}` },
            },
          }
        )
        // Asumsi field yang bisa dicari dari dokumen yang direlasikan di dalam array embedded
        searchableFieldPaths.push(
          `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details.name`
        )
        searchableFieldPaths.push(
          `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details.displayName`
        )
        searchableFieldPaths.push(
          `${embeddedArrayField.name}.${productIdFieldInEmbedded.name}Details.title`
        )
      }
    }

    // 3. Handle relasi One-to-Many yang didefinisikan di `relations` array di level collection
    const oneToManyRelations = collectionConfigRelations.filter(
      (rel) => rel.type === 'one-to-many' && rel.localCollection === currentCollectionName
    )

    oneToManyRelations.forEach((rel) => {
      pipelineStages.push({
        $lookup: {
          from: rel.foreignCollection,
          localField: rel.localField,
          foreignField: rel.foreignField,
          as: rel.foreignCollection,
        },
      })
      // Asumsi field yang bisa dicari dari koleksi One-to-Many
      searchableFieldPaths.push(`${rel.foreignCollection}.name`)
      searchableFieldPaths.push(`${rel.foreignCollection}.displayName`)
      searchableFieldPaths.push(`${rel.foreignCollection}.title`)
      searchableFieldPaths.push(`${rel.foreignCollection}.description`)
    })

    // --- Tambahkan stage $match untuk pencarian ---
    if (searchQuery) {
      const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // const searchRegex = new RegExp(escapedSearchQuery, 'i');
      let searchRegex = { $regex: escapedSearchQuery, $options: 'i' }

      const orConditions = []

      // Filter duplikat dan pastikan hanya jalur field yang valid
      const uniqueSearchableFields = [...new Set(searchableFieldPaths)].filter(Boolean)

      uniqueSearchableFields.forEach((fieldPath) => {
        orConditions.push({
          [fieldPath]: searchRegex,
        })
      })

      // Tambahkan kondisi untuk mencari _id jika query terlihat seperti ObjectId
      if (searchQuery.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          orConditions.push({ _id: new ObjectId(searchQuery) })
        } catch (e) {
          // Abaikan jika bukan ObjectId valid
        }
      }

      // Tambahkan kondisi untuk mencari nilai number jika query adalah angka
      if (!isNaN(parseFloat(searchQuery)) && isFinite(searchQuery)) {
        const numericValue = parseFloat(searchQuery)
        // Iterasi melalui collectionConfigFields untuk menambahkan field numerik yang dapat dicari
        collectionConfigFields.forEach((field) => {
          if (field.type === 'number' || field.type === 'integer') {
            orConditions.push({ [field.name]: numericValue })
          }
        })
      }

      if (orConditions.length > 0) {
        pipelineStages.push({
          $match: {
            $or: orConditions,
          },
        })
      }
    }

    return pipelineStages
  }
  /**
   * Memuat semua konfigurasi koleksi yang tersimpan.
   * @param {string} id - ID dokumen yang akan diambil.
   * @returns {Promise<Array<object>>} Promise yang resolve dengan array objek konfigurasi koleksi.
   */

  async getCollectionConfigs(id) {
    try {
      const configs = await database.data?.collection('_collectionConfigs').findOne({ _id: id })
      return configs
    } catch (error) {
      console.error('Gagal memuat semua konfigurasi koleksi:', error.message)
      return []
    }
  }
  /**
   * Mengambil semua konfigurasi koleksi, mendukung paginasi (opsional).
   * @param {number} [page=1] - Nomor halaman.
   * @param {number} [limit=0] - Jumlah item per halaman. 0 berarti semua.
   * @returns {Promise<{configs: Array<object>, totalCount: number, totalPages: number}>}
   */
  async getAllCollectionConfigs(page = 1, limit = 0) {
    try {
      const totalCount = await database.data?.collection('_collectionConfigs').countDocuments({})
      const pipeline = []

      if (limit > 0) {
        // Hanya terapkan paginasi jika limit > 0
        const skip = (page - 1) * limit
        pipeline.push({ $skip: skip }, { $limit: limit })
      }

      const configs = await database.data
        ?.collection('_collectionConfigs')
        .aggregate(pipeline)
        .toArray()
      const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1 // Jika tidak ada paginasi, total halaman 1

      return {
        configs,
        totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit > 0 ? limit : totalCount, // Jika limit 0, items per page adalah total count
      }
    } catch (err) {
      console.error('Gagal mendapatkan semua konfigurasi koleksi:', err.message)
      throw err
    }
  }
  /**
   * Mengambil satu dokumen dari koleksi dengan relasi yang di-populate.
   * @param {object} database - Objek koneksi database.
   * @param {string} collectionName - Nama koleksi yang akan dikueri.
   * @param {string} id - ID dokumen yang akan diambil.
   * @param {object} collectionConfig - Objek konfigurasi untuk koleksi ini.
   * @returns {Promise<object|null>} Dokumen dengan relasi yang di-populate, atau null jika tidak ditemukan.
   */
  async getOneWithRelations(collectionName, id, collectionConfig) {
    const collection = database.data?.collection(collectionName)
    try {
      const objectId = new ObjectId(id)
      let pipeline = [{ $match: { _id: objectId } }]

      // Tambahkan stage lookup berdasarkan konfigurasi relasi
      pipeline = pipeline.concat(
        this.buildRelationLookupPipeline(
          collectionName,
          collectionConfig.fields,
          collectionConfig.relations
        )
      )

      const documents = await collection?.aggregate(pipeline).toArray()
      return documents.length > 0 ? documents[0] : null
    } catch (error) {
      if (error.name === 'BSONTypeError') {
        console.error(`ID tidak valid untuk koleksi '${collectionName}':`, id)
      } else {
        console.error(
          `Gagal mengambil dokumen dengan relasi dari '${collectionName}':`,
          error.message
        )
      }
      throw error // Re-throw untuk penanganan error di caller
    }
  }

  /**
   * Mengambil semua dokumen dari koleksi dengan relasi yang di-populate.
   * @param {object} database - Objek koneksi database.
   * @param {string} collectionName - Nama koleksi yang akan dikueri.
   * @param {object} collectionConfig - Objek konfigurasi untuk koleksi ini.
   * @returns {Promise<Array<object>>} Array dokumen dengan relasi yang di-populate.
   */
  async getAllWithRelations(
    collectionName,
    collectionConfig,
    page = 1,
    limit = 10,
    searchQuery = ''
  ) {
    const collection = database.data?.collection(collectionName)
    try {
      // Pastikan page dan limit adalah angka positif
      page = parseInt(page) > 0 ? parseInt(page) : 1
      limit = parseInt(limit) > 0 ? parseInt(limit) : 10
      const skip = (page - 1) * limit

      // Tahap 1: Hitung total dokumen tanpa paginasi
      const totalCount = await collection?.countDocuments({})
      let pipeline = []
      pipeline.push({ $skip: skip }, { $limit: limit })
      // Tambahkan stage lookup berdasarkan konfigurasi relasi
      pipeline = pipeline.concat(
        this.buildRelationLookupPipeline(
          collectionName,
          collectionConfig.fields,
          collectionConfig.relations,
          searchQuery
        )
      )
      const documents = await collection?.aggregate(pipeline).toArray()
      const totalPages = Math.ceil(totalCount / limit)
      // return documents

      return {
        documents,
        totalCount,
        totalPages,
        currentPage: page,
        limit: limit,
      }
    } catch (error) {
      console.error(
        `Gagal mengambil semua dokumen dengan relasi dari '${collectionName}':`,
        error.message
      )
      throw error
    }
  }

  /**
   * Menambahkan dokumen baru ke koleksi.
   * @param {object} database - Objek koneksi database.
   * @param {string} collectionName - Nama koleksi target.
   * @param {object} documentData - Data dokumen yang akan disimpan (diasumsikan objek tunggal).
   * @param {object} collectionConfig - Objek konfigurasi untuk koleksi ini (untuk konversi ObjectId, validasi).
   * @returns {Promise<object>} Objek yang disimpan dengan _id yang dihasilkan.
   */
  async createDocument(collectionName, documentData, collectionConfig) {
    const collection = database.data?.collection(collectionName)
    if (!collection) {
      throw new Error(`Koleksi '${collectionName}' tidak ditemukan atau database tidak terhubung.`)
    }

    try {
      // Proses dan validasi data dokumen sebelum penyisipan
      // Parameter terakhir 'false' menunjukkan ini bukan operasi update
      const docToInsert = this._processDocumentData(
        documentData,
        collectionConfig.fields,
        ObjectId,
        false
      )

      const result = await collection.insertOne(docToInsert)
      return { _id: result.insertedId, ...docToInsert }
    } catch (error) {
      console.error(`Gagal membuat dokumen di '${collectionName}':`, error.message)
      throw error
    }
  }
  /**
   * Memperbarui dokumen di koleksi.
   * @param {object} database - Objek koneksi database.
   * @param {string} collectionName - Nama koleksi target.
   * @param {string} id - ID dokumen yang akan diperbarui.
   * @param {object} updateData - Data yang akan diperbarui (diasumsikan objek tunggal).
   * @param {object} collectionConfig - Objek konfigurasi untuk koleksi ini (untuk konversi ObjectId, validasi).
   * @returns {Promise<object|null>} Dokumen yang diperbarui, atau null jika tidak ditemukan.
   */
  async updateDocument(collectionName, id, updateData, collectionConfig) {
    const collection = database.data?.collection(collectionName)
    if (!collection) {
      throw new Error(`Koleksi '${collectionName}' tidak ditemukan atau database tidak terhubung.`)
    }
    try {
      const objectId = new ObjectId(id)

      // Proses dan validasi data update
      // Parameter terakhir 'true' menunjukkan ini adalah operasi update
      let dataToUpdate = this._processDocumentData(
        updateData,
        collectionConfig.fields,
        ObjectId,
        true
      )

      // Hapus _id dari data update untuk mencegah modifikasi _id
      delete dataToUpdate._id
      // Jika ada field 'id' yang merupakan ObjectId dan dikirim oleh klien, hapus juga untuk update
      if (
        dataToUpdate.id &&
        collectionConfig.fields.find((f) => f.name === 'id' && f.type === 'ObjectId')
      ) {
        delete dataToUpdate.id
      }

      // Filter secara eksplisit field yang bersifat hanya-baca (readOnly) untuk operasi update
      collectionConfig.fields.forEach((field) => {
        if (field.readOnly && dataToUpdate.hasOwnProperty(field.name)) {
          delete dataToUpdate[field.name]
        }
      })

      const result = await collection.updateOne({ _id: objectId }, { $set: dataToUpdate })

      if (result.matchedCount === 0) {
        return null
      }

      // Mengambil dokumen yang sudah diupdate dengan relasi yang di-populate
      const updatedDoc = await this.getOneWithRelations(collectionName, id, collectionConfig)
      return updatedDoc
    } catch (error) {
      if (error.name === 'BSONTypeError') {
        console.error(`ID tidak valid untuk koleksi '${collectionName}':`, id)
      } else {
        console.error(`Gagal memperbarui dokumen di '${collectionName}':`, error.message)
      }
      throw error
    }
  }
  /**
   * Menghapus dokumen dari koleksi.
   * @param {object} database - Objek koneksi database.
   * @param {string} collectionName - Nama koleksi target.
   * @param {string} id - ID dokumen yang akan dihapus.
   * @returns {Promise<boolean>} True jika berhasil dihapus, false jika tidak ditemukan.
   */
  async deleteDocument(collectionName, id) {
    const collection = database.data?.collection(collectionName)
    try {
      const objectId = new ObjectId(id)
      const result = await collection.deleteOne({ _id: objectId })
      return result.deletedCount > 0
    } catch (error) {
      if (error.name === 'BSONTypeError') {
        console.error(`ID tidak valid untuk koleksi '${collectionName}':`, id)
      } else {
        console.error(`Gagal menghapus dokumen dari '${collectionName}':`, error.message)
      }
      throw error
    }
  }
  /**
   * Mengonversi tipe data backend ke tipe input UI yang sesuai.
   * @param {string} backendType - Tipe data dari konfigurasi database (e.g., 'String', 'Number', 'Date', 'ObjectId').
   * @returns {string} Tipe input HTML atau tipe kontrol UI kustom.
   */
  mapBackendTypeToUIType(backendType) {
    switch (backendType) {
      case 'String':
        return 'text'
      case 'Number':
        return 'number'
      case 'Date':
        return 'datetime-local' // atau 'date', 'time' tergantung kebutuhan
      case 'Boolean':
        return 'checkbox'
      case 'ObjectId':
        return 'text' // Akan diubah menjadi dropdown/autocomplete jika ada relasi
      case 'Object':
        return 'group' // Menandakan sekumpulan field
      case 'Array':
        return 'array' // Menandakan array, mungkin memerlukan sub-form atau tag input
      default:
        return 'text'
    }
  }

  /**
   * Mengonversi nama camelCase ke display name yang lebih mudah dibaca.
   * @param {string} name - Nama field dalam camelCase (e.g., 'firstName').
   * @returns {string} Nama yang diformat dengan spasi dan kapitalisasi awal (e.g., 'First Name').
   */
  formatDisplayName(name) {
    // Ubah camelCase menjadi spasi, lalu kapitalisasi huruf pertama setiap kata
    return name
      .replace(/([A-Z])/g, ' $1') // Tambahkan spasi sebelum huruf kapital
      .replace(/^./, (str) => str.toUpperCase()) // Kapitalisasi huruf pertama
      .trim()
  }

  /**
   * Meng-*generate* konfigurasi UI untuk satu koleksi.
   * @param {object} collectionConfig - Objek konfigurasi koleksi dari database.
   * @param {Array<object>} allCollectionConfigs - Semua konfigurasi koleksi (untuk lookup relasi).
   * @returns {object} Objek konfigurasi UI yang siap digunakan frontend.
   */
  generateUIConfigForCollection(collectionConfig, allCollectionConfigs) {
    const uiConfig = {
      name: collectionConfig.name,
      displayName: collectionConfig.displayName || this.formatDisplayName(collectionConfig.name),
      description: collectionConfig.description || `Manajemen data untuk ${collectionConfig.name}`,
      formFields: [],
      tableColumns: [],
      detailViewFields: [],
      relations: [],
    }

    // Proses fields untuk formFields, tableColumns, detailViewFields
    collectionConfig.fields.forEach((field) => {
      // Abaikan field _id untuk input form kecuali secara eksplisit dibutuhkan
      if (field.name === '_id' && !field.isPrimaryKey) {
        // _id biasanya tidak diinput user, tapi penting untuk detail/table
        uiConfig.detailViewFields.push({
          name: field.name,
          label: field.label || this.formatDisplayName(field.name),
        })
        uiConfig.tableColumns.push({
          name: field.name,
          label: field.label || this.formatDisplayName(field.name),
        })
        return // Lanjut ke field berikutnya
      }

      const uiField = {
        name: field.name,
        label: field.label || this.formatDisplayName(field.name),
        inputType: this.mapBackendTypeToUIType(field.type),
        required: !!field.required, // Konversi ke boolean
        unique: !!field.unique, // Konversi ke boolean
        readOnly: !!field.readOnly, // Konversi ke boolean
        visibleInForm:
          field.visibleInForm !== undefined
            ? field.visibleInForm
            : field.name !== '_id' && field.autoGenerate !== true, // Default true kecuali _id atau autoGenerate
        visibleInTable:
          field.visibleInTable !== undefined ? field.visibleInTable : field.name !== 'password', // Default true kecuali password
        visibleInDetail: field.visibleInDetail !== undefined ? field.visibleInDetail : true, // Default true
      }

      // Tambahkan properti validasi spesifik
      if (field.minLength) uiField.minLength = field.minLength
      if (field.maxLength) uiField.maxLength = field.maxLength
      if (field.min) uiField.min = field.min
      if (field.max) uiField.max = field.max
      if (field.pattern) uiField.pattern = field.pattern
      if (field.format) uiField.format = field.format // Contoh: 'email', 'url'
      if (field.enum) {
        uiField.inputType = 'dropdown'
        uiField.options = field.enum.map((val) => ({ label: formatDisplayName(val), value: val }))
      }
      if (field.default !== undefined) uiField.default = field.default
      if (field.placeholder) uiField.placeholder = field.placeholder

      // Handle nested fields (untuk type: 'Object' atau 'Array' dengan item type 'Object')
      if (field.type === 'Object' && Array.isArray(field.fields)) {
        uiField.inputType = 'group'
        uiField.fields = generateUIConfigForNestedFields(field.fields)
      } else if (
        field.type === 'Array' &&
        field.items &&
        field.items.type === 'Object' &&
        Array.isArray(field.items.fields)
      ) {
        uiField.inputType = 'array' // Atau 'tags', 'multi-select', tergantung kebutuhan
        uiField.itemSchema = generateUIConfigForNestedFields(field.items.fields)
      }

      // Handle relasi Many-to-One untuk dropdown/autocomplete di UI
      if (
        field.relation &&
        field.relation.type === 'many-to-one' &&
        field.relation.targetCollection
      ) {
        uiField.inputType = 'select' // Atau 'autocomplete'
        uiField.optionsSource = {
          endpoint: `/api/dynamic/${field.relation.targetCollection}`,
          valueField: '_id',
          labelField: 'name', // Asumsi ada field 'name' di target collection untuk display
        }
        // Jika targetCollection punya displayName, gunakan itu
        const targetConfig = allCollectionConfigs.find(
          (c) => c.name === field.relation.targetCollection
        )
        if (targetConfig && targetConfig.fields) {
          const displayField =
            targetConfig.fields.find((f) => f.isDisplayName === true) ||
            targetConfig.fields.find((f) => f.name === 'name' || f.name === 'title')
          if (displayField) {
            uiField.optionsSource.labelField = displayField.name
          }
        }
        uiField.visibleInTable = true // Field ID yang berelasi sering terlihat di tabel
      }

      // Tambahkan field ke formFields, tableColumns, detailViewFields jika visible
      if (uiField.visibleInForm) {
        uiConfig.formFields.push(uiField)
      }
      if (uiField.visibleInTable) {
        uiConfig.tableColumns.push({ name: uiField.name, label: uiField.label })
      }
      if (uiField.visibleInDetail) {
        uiConfig.detailViewFields.push({ name: uiField.name, label: uiField.label })
      }
    })

    // Proses relasi di level collection (one-to-many, many-to-many) untuk tampilan detail/dashboard
    collectionConfig.relations.forEach((relation) => {
      // Ini adalah relasi yang biasanya tidak muncul sebagai input langsung di form
      // tetapi sebagai link atau sub-tabel di detail view
      const uiRelation = {
        name: relation.name || relation.foreignCollection,
        label: relation.label || this.formatDisplayName(relation.foreignCollection),
        type: relation.type,
        targetCollection: relation.foreignCollection,
        // Target field untuk display, bisa di-override di config
        targetFieldToDisplay: relation.targetFieldToDisplay || 'name',
      }

      // Untuk One-to-Many, berikan informasi tentang bagaimana mendapatkan data terkait
      if (relation.type === 'one-to-many') {
        uiRelation.queryParam = {
          paramName: relation.foreignField, // misal: 'userId' untuk collection 'orders'
          valueSource: relation.localField, // misal: '_id' dari collection saat ini ('users')
        }
        uiRelation.endpoint = `/api/dynamic/${relation.foreignCollection}`
      }
      // TODO: Tambahkan logika untuk relasi many-to-many jika diimplementasikan secara berbeda (misal: via intermediary collection)

      uiConfig.relations.push(uiRelation)
    })

    return uiConfig
  }

  /**
   * Fungsi helper rekursif untuk meng-*generate* UI config untuk nested fields.
   * @param {Array<object>} fields - Array definisi field nested.
   * @returns {Array<object>} Array konfigurasi UI untuk field nested.
   */
  generateUIConfigForNestedFields(fields) {
    const nestedUiFields = []
    fields.forEach((field) => {
      const uiField = {
        name: field.name,
        label: field.label || this.formatDisplayName(field.name),
        inputType: this.mapBackendTypeToUIType(field.type),
        required: !!field.required,
        unique: !!field.unique,
        readOnly: !!field.readOnly,
        visibleInForm: field.visibleInForm !== undefined ? field.visibleInForm : true,
        visibleInTable: field.visibleInTable !== undefined ? field.visibleInTable : true,
        visibleInDetail: field.visibleInDetail !== undefined ? field.visibleInDetail : true,
      }

      if (field.minLength) uiField.minLength = field.minLength
      if (field.maxLength) uiField.maxLength = field.maxLength
      if (field.min) uiField.min = field.min
      if (field.max) uiField.max = field.max
      if (field.pattern) uiField.pattern = field.pattern
      if (field.format) uiField.format = field.format
      if (field.enum) {
        uiField.inputType = 'dropdown'
        uiField.options = field.enum.map((val) => ({ label: formatDisplayName(val), value: val }))
      }
      if (field.default !== undefined) uiField.default = field.default
      if (field.placeholder) uiField.placeholder = field.placeholder

      // Recursive call for deeper nesting
      if (field.type === 'Object' && Array.isArray(field.fields)) {
        uiField.inputType = 'group'
        uiField.fields = generateUIConfigForNestedFields(field.fields)
      } else if (
        field.type === 'Array' &&
        field.items &&
        field.items.type === 'Object' &&
        Array.isArray(field.items.fields)
      ) {
        uiField.inputType = 'array'
        uiField.itemSchema = generateUIConfigForNestedFields(field.items.fields)
      }

      // Handle nested many-to-one relations
      if (
        field.relation &&
        field.relation.type === 'many-to-one' &&
        field.relation.targetCollection
      ) {
        uiField.inputType = 'select' // Or 'autocomplete'
        uiField.optionsSource = {
          endpoint: `/api/dynamic/${field.relation.targetCollection}`,
          valueField: '_id',
          labelField: 'name',
        }
        // Try to find a more suitable label field for the target collection
        const targetConfig = allCollectionConfigs.find(
          (c) => c.name === field.relation.targetCollection
        )
        if (targetConfig && targetConfig.fields) {
          const displayField =
            targetConfig.fields.find((f) => f.isDisplayName === true) ||
            targetConfig.fields.find((f) => f.name === 'name' || f.name === 'title')
          if (displayField) {
            uiField.optionsSource.labelField = displayField.name
          }
        }
      }
      nestedUiFields.push(uiField)
    })
    return nestedUiFields
  }

  /**
   * Fungsi utama untuk menghasilkan semua konfigurasi UI.
   * @param {Array<object>} allCollectionConfigs - Semua konfigurasi koleksi dari database.
   * @returns {object} Objek di mana key adalah nama koleksi dan value adalah konfigurasi UI-nya.
   */
  generateAllUIConfigs(allCollectionConfigs) {
    const uiConfigs = {}
    allCollectionConfigs.forEach((config) => {
      uiConfigs[config.name] = this.generateUIConfigForCollection(config, allCollectionConfigs)
    })
    return uiConfigs
  }
  /**
   * Fungsi helper untuk secara rekursif memproses data dokumen berdasarkan konfigurasi field.
   * Ini termasuk mengonversi string ID menjadi instance ObjectId, memvalidasi field wajib,
   * dan melakukan casting tipe dasar.
   * @param {object} data - Data dokumen yang akan diproses.
   * @param {Array<object>} fieldsConfig - Array konfigurasi field untuk level saat ini.
   * @param {function} ObjectIdClass - Konstruktor ObjectId (misalnya, require('mongodb').ObjectId).
   * @param {boolean} [isUpdate=false] - Bendera untuk menunjukkan apakah operasi adalah update (mempengaruhi pemeriksaan readOnly).
   * @returns {object} Objek baru dengan data yang diproses.
   * @throws {Error} Jika field wajib hilang atau ObjectId tidak valid, atau tipe data tidak sesuai.
   */
  _processDocumentData(data, fieldsConfig, ObjectIdClass, isUpdate = false) {
    if (!data || typeof data !== 'object') {
      throw new Error('Data dokumen harus berupa objek.')
    }

    // Buat salinan baru objek untuk menghindari memodifikasi input asli secara langsung.
    const processedData = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        processedData[key] = data[key] // Salin semua properti
      }
    }

    fieldsConfig.forEach((field) => {
      const fieldName = field.name
      const value = processedData[fieldName]

      // 1. Validasi Field Wajib (Required)
      if (
        field.required &&
        (value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === ''))
      ) {
        throw new Error(`Field '${fieldName}' wajib diisi.`)
      }

      // 2. Penanganan Konversi ObjectId
      if (field.type === 'ObjectId' && value !== undefined && value !== null) {
        if (typeof value === 'string') {
          try {
            processedData[fieldName] = new ObjectIdClass(value)
          } catch (e) {
            throw new Error(
              `Field '${fieldName}' memiliki ID yang tidak valid: ${value}. Error asli: ${e.message}`
            )
          }
        } else if (!(value instanceof ObjectIdClass)) {
          throw new Error(
            `Field '${fieldName}' diharapkan string atau instance ObjectId, tapi menerima: ${typeof value}`
          )
        }
      }
      // 3. Casting/Validasi Tipe Dasar (tambahkan lebih banyak jika diperlukan)
      else if (value !== undefined && value !== null) {
        switch (field.type) {
          case 'number':
            const numValue = Number(value)
            if (isNaN(numValue)) {
              throw new Error(
                `Field '${fieldName}' diharapkan berupa angka, tapi menerima: ${value}`
              )
            }
            processedData[fieldName] = numValue
            break
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(
                `Field '${fieldName}' diharapkan berupa boolean, tapi menerima: ${value}`
              )
            }
            processedData[fieldName] = value
            break
          case 'datetime':
            // Asumsikan input adalah string tanggal yang valid atau objek Date.
            if (value instanceof Date) {
              processedData[fieldName] = value.toISOString()
            } else if (typeof value === 'string') {
              // Validasi dasar untuk string tanggal: coba parse
              if (isNaN(new Date(value).getTime())) {
                throw new Error(
                  `Field '${fieldName}' memiliki format tanggal/waktu yang tidak valid: ${value}`
                )
              }
              // Opsional: konversi ke format ISO string yang konsisten
              // processedData[fieldName] = new Date(value).toISOString();
            } else {
              throw new Error(
                `Field '${fieldName}' diharapkan string tanggal/waktu atau objek Date, tapi menerima: ${typeof value}`
              )
            }
            break
          // Tambahkan tipe lain seperti 'string' jika validasi spesifik diperlukan (misalnya, regex)
        }
      }

      // 4. Penanganan Struktur Bersarang (Array of Objects, Nested Objects)
      if (
        field.type === 'Array' &&
        Array.isArray(value) &&
        field.items &&
        field.items.type === 'Object' &&
        field.items.fields
      ) {
        processedData[fieldName] = value.map((item) =>
          _processDocumentData(item, field.items.fields, ObjectIdClass, isUpdate)
        )
      } else if (
        field.type === 'Object' &&
        typeof value === 'object' &&
        value !== null &&
        field.fields
      ) {
        processedData[fieldName] = _processDocumentData(
          value,
          field.fields,
          ObjectIdClass,
          isUpdate
        )
      }
    })

    return processedData
  }
}

export default new ConfigurationService()
