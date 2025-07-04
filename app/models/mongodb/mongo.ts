import { collections, database } from '#services/mongodb_service'
import { ObjectId } from 'mongodb'
import moment from 'moment'

class MongoDBModels {
  async FindOne(query: object, collection: string) {
    const collections = database.data?.collection(collection)
    return await collections.findOne(query)
  }

  async FindWithPaging(
    query: object,
    skip: number,
    paging: number,
    sort: object,
    collection: string
  ) {
    const collections = database.data?.collection(collection)
    return await collections.find(query).skip(skip).limit(paging).sort(sort).toArray()
  }

  async GetLength(query: object, collection: string) {
    const collections = database.data?.collection(collection)
    return await collections.countDocuments(query)
  }

  async RenameObject(query: object, collection: string, updated: object) {
    const collections = database.data?.collection(collection)
    return await collections.updateMany(query, { $rename: updated })
  }

  async InsertOne(query: object, collection: string) {
    const collections = database.data?.collection(collection)
    return await collections?.insertOne(query)
  }

  async DeletetOne(unique: string | number, query: object, collection: string) {
    unique = unique.length < 24 ? unique : new ObjectId(unique)
    if (unique) {
      query._id = unique
    }
    const collections = database.data?.collection(collection)
    return await collections?.deleteOne(query)
  }

  async UpdateOne(unique: string | number, query: object, collection: string) {
    let newQuery = query
    unique = unique.length < 24 ? unique : new ObjectId(unique)
    const collections = database.data?.collection(collection)
    newQuery.updated_at = new Date().toISOString()
    return await collections?.updateOne({ _id: unique }, { $set: newQuery })
  }

  async Distinct(query: string, collection: string) {
    const collections = database.data?.collection(collection)
    return await collections.distinct(query)
  }

  async DeleteCollection(collection: string) {
    const collection_list = await database.data?.listCollections().toArray()
    const collectionExists = collection_list.some((col) => col.name === collection)
    if (!collectionExists) {
      return { status: true, message: 'Collection does not exist' }
    }
    const collections = database.data?.collection(collection)
    return await collections.drop()
  }
}

export default new MongoDBModels()
