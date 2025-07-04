import env from '#start/env'

export const MongoDBConfig = {
  host: env.get('MONGO_HOST'),
}
