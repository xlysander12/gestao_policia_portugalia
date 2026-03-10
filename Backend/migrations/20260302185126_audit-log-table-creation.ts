import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("audit_logs", table => {
        table.increments("id").primary().notNullable();
        table.integer("nif").notNullable()
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.string("ip_address").nullable();
        table.datetime("timestamp").notNullable().defaultTo(knex.fn.now());
        table.string("module").notNullable();
        table.enum("action", ["add", "update", "manage", "delete", "restore"]).notNullable();
        table.string("type").nullable();
        table.integer("target").nullable();
        table.jsonb("details").nullable();
        table.integer("status_code").notNullable();
        table.jsonb("response").notNullable();
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("audit_logs");
}

