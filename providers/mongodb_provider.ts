import type { ApplicationService } from '@adonisjs/core/types'
import { MongoDB } from '#services/mongodb_service'
export default class MongodbProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    const { MongoDBConfig } = this.app.config.get('mongodb')
    this.app.container.bind('connection_mongodb', () => {
      return new MongoDB(MongoDBConfig)
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    const mongodb = await this.app.container.make('connection_mongodb')
    await mongodb.connectMongoDB()
  }

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
