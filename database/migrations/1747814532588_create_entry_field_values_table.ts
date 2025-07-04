import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'entry_field_values'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('entry_id')
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
        .onDelete('CASCADE')
      table.text('value').nullable() // Gunakan TEXT untuk menyimpan nilai yang bisa berupa JSON string atau string biasa

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())

      // Menambahkan unique constraint untuk kombinasi entry_id dan field_id
      // Agar satu entri tidak memiliki nilai ganda untuk satu field
      table.unique(['entry_id', 'field_id'])

      // Menambahkan index untuk performa query
      table.index(['entry_id', 'field_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
