import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'module_entry_relations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('source_entry_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('module_entries')
        .onDelete('CASCADE')
      table
        .integer('target_entry_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('module_entries')
        .onDelete('CASCADE')
      table
        .integer('field_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('fields')
        .onDelete('CASCADE') // Untuk mengidentifikasi relasi melalui field mana

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Menambahkan unique constraint untuk mencegah duplikasi relasi yang sama
      table.unique(['source_entry_id', 'target_entry_id', 'field_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
