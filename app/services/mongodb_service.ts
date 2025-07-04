import { MongoClient, ServerApiVersion, Collection, Db } from 'mongodb'
import { MongoDBConfig } from 'Config/mongodb'
import env from '#start/env'

export const collections: { data?: Collection } = {}
export const database: { data?: Db } = {}
export class MongoDB {
  protected connectiondb: ConnectionDB
  constructor(config: typeof MongoDBConfig) {
    this.connectiondb = new ConnectionDB(config)
  }

  public async connectMongoDbCollection() {
    const config = this.connectiondb
    const url = `mongodb+srv://${config['host']}`
    const client = new MongoClient(url)
    await client.connect()
    const db = await client.db('dony')
    collections.data = await db.collection('user')
  }

  public async connectMongoDB() {
    const config = this.connectiondb
    const url = `${config['host']}`
    const client = new MongoClient(url)
    await client.connect()
    database.data = await client.db(env.get('MONGO_DBNAME'))
    console.log('Successfully connected to MongoDb')
  }
}

class ConnectionDB {
  protected host: string

  constructor(config: typeof MongoDBConfig) {
    this.host = config.host
  }
}
