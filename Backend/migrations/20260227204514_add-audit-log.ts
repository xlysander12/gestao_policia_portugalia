import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("audit_log", table => {
        table.increments("id").primary();
        table.timestamp("timestamp").notNullable().defaultTo(knex.fn.now());
        table.integer("author").unsigned().notNullable();
        table.string("module", 50).notNullable();
        table.string("action", 50).notNullable();
        table.text("details").nullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("audit_log");
}
