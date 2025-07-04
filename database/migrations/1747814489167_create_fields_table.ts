import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'fields'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('module_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('modules')
        .onDelete('CASCADE')
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable() // Slug unik per module, bisa tambahkan unique(['module_id', 'slug'])
      table.string('field_type', 50).notNullable() // e.g., 'Text', 'Number', 'Selection', 'Relational'
      table.json('settings').nullable() // JSON untuk konfigurasi field spesifik
      table.boolean('is_required').defaultTo(false)
      table.text('default_value').nullable()
      table.integer('order').defaultTo(0)

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Menambahkan index untuk module_id untuk performa query
      table.index('module_id')
      // Menambahkan unique constraint untuk kombinasi module_id dan slug
      table.unique(['module_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
