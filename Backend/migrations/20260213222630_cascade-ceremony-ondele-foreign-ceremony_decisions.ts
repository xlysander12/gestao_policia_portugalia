import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("ceremony_decisions", (table) => {
        table.dropForeign("ceremony", "FK_ceremony_decisions_ceremony");

        table.foreign("ceremony", "FK_ceremony_decisions_ceremony")
            .references("id").inTable("events")
            .onUpdate("cascade").onDelete("cascade");
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("ceremony_decisions", (table) => {
        table.dropForeign("ceremony", "FK_ceremony_decisions_ceremony");

        table.foreign("ceremony", "FK_ceremony_decisions_ceremony")
            .references("id").inTable("events")
            .onUpdate("cascade");
    });
}

