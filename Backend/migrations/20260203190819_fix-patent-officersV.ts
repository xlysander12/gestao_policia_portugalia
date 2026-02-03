import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    // Delete the existing officersV view
    await knex.schema.dropViewIfExists("officersV");

    // Recreate the officersV view with the corrected definition
    await knex.raw(`
        CREATE VIEW officersV AS
        SELECT
            officers.name AS name,
            officers.patent AS patent,
            patents.category AS patentCategory,
            officers.callsign AS callsign,
            officers.status AS status,
            officers.entry_date AS entry_date,
            officers.promotion_date AS promotion_date,
            officers.phone AS phone,
            officers.nif AS nif,
            officers.iban AS iban,
            officers.kms AS kms,
            officers.discord AS discord,
            officers.steam AS steam
        FROM (
            officers
            JOIN patents ON patents.id = officers.patent
        )
        WHERE
            officers.visible = 1 AND officers.fired = 0
        ORDER BY
            officers.patent DESC,
            CAST(SUBSTR(officers.callsign, 3) AS SIGNED)
    `);

}


export async function down(knex: Knex): Promise<void> {
    // Delete the existing officersV view
    await knex.schema.dropViewIfExists("officersV");

    // Recreate the officersV view with the previous definition
    await knex.raw(`
        CREATE VIEW officersV AS
        SELECT
            officers.name AS name,
            patents.name AS patent,
            patents.category AS patentCategory,
            officers.callsign AS callsign,
            officers.status AS status,
            officers.entry_date AS entry_date,
            officers.promotion_date AS promotion_date,
            officers.phone AS phone,
            officers.nif AS nif,
            officers.iban AS iban,
            officers.kms AS kms,
            officers.discord AS discord,
            officers.steam AS steam
        FROM (
            officers
            JOIN patents ON patents.id = officers.patent
        )
        WHERE
            officers.visible = 1 AND officers.fired = 0
        ORDER BY
            officers.patent DESC,
            CAST(SUBSTR(officers.callsign, 3) AS SIGNED)
    `);

}

