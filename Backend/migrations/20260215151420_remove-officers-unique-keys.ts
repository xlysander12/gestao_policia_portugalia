import type { Knex } from "knex";

/**
 * There have been some problems regarding value recycling, where previously used values for IBAN, phone, etc., are being reused for new officers.
 * This migration removes the unique constraints on the officers table, allowing for value recycling without causing database errors.
 */

export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable("officers", table => {
        table.dropUnique(["phone"], "officers_phone_unique");
        table.dropUnique(["iban"], "officers_iban_unique");
        table.dropUnique(["discord"], "officers_discord_unique");
    });
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable("officers", table => {
        table.unique(["phone"], {indexName: "officers_phone_unique"});
        table.unique(["iban"], {indexName: "officers_iban_unique"});
        table.unique(["discord"], {indexName: "officers_discord_unique"});
    });
}

