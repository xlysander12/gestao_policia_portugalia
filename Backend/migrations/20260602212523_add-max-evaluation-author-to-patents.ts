import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("patents", table => {
        table
            .integer("max_evaluation_author")
            .unsigned()
            .after("max_evaluation")
            .defaultTo(0)
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("patents", table => {
        table.dropColumn("max_evaluation_author");
    });
}

