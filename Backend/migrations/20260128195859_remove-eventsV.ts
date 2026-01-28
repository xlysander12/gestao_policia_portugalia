import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    // Drop the eventsV view if it exists
    await knex.schema.dropViewIfExists("eventsV");
}


export function down(_knex: Knex): Promise<void> {
    // Since this view is a cluster-fuck, we will not attempt to do so in the down migration
    throw new Error("This migration can't be reverted");
}

