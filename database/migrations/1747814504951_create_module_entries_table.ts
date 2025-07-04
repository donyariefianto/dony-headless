import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'module_entries'

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

      // Kolom untuk konfigurasi setiap baris data
      // Akan menyimpan JSON seperti {"icon": "fa-star", "color": "#FF0000", "note": "Penting", "hide": false}
      table.json('row_config').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Menambahkan index untuk module_id
      table.index('module_id')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
