import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    // First, drop the foreign key
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.dropForeign("ceremony", "FK_ceremony_decisions_ceremony");
    });

    // Set the column to be nullable
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.integer("ceremony").unsigned().nullable().alter();
    });

    // Recreate the foreign key with the new nullable column
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.foreign("ceremony", "FK_ceremony_decisions_ceremony")
            .references("id").inTable("events")
            .onDelete("set null").onUpdate("cascade");
    });

    // * Create `events` triggers
    // Insert trigger
    await knex.raw(`
        CREATE TRIGGER set_ceremony_decisions_ceremony_insert
        AFTER INSERT ON events
        FOR EACH ROW
        BEGIN
            DECLARE event_variant VARCHAR(255);
            DECLARE last_decision_date DATETIME;
            
            -- Only execute if the event is a ceremony
            SELECT 
                variant INTO event_variant
            FROM event_types WHERE id = NEW.type;
            
            IF event_variant = 'ceremony' THEN
                -- Get the last decision date
                SELECT
                    MAX(events.start)
                INTO last_decision_date
                FROM
                    ceremony_decisions JOIN events ON ceremony_decisions.ceremony = events.id;
                
                -- If the last date is NULL or the new event's start is after the last decision date, update the ceremony_decisions
                IF last_decision_date IS NULL OR NEW.start > last_decision_date THEN
                    UPDATE ceremony_decisions
                    SET ceremony = NEW.id
                    WHERE ceremony IS NULL;
                END IF;
            END IF;
        END;
    `);

    // Update trigger
    // Insert trigger
    await knex.raw(`
        CREATE TRIGGER set_ceremony_decisions_ceremony_update
        AFTER UPDATE ON events
        FOR EACH ROW
        BEGIN
            DECLARE event_variant VARCHAR(255);
            DECLARE last_decision_date DATETIME;
            
            -- Only execute if the event is a ceremony
            SELECT 
                variant INTO event_variant
            FROM event_types WHERE id = NEW.type;
            
            IF event_variant = 'ceremony' THEN
                -- Get the last decision date
                SELECT
                    MAX(events.start)
                INTO last_decision_date
                FROM
                    ceremony_decisions JOIN events ON ceremony_decisions.ceremony = events.id;
                
                -- If the last date is NULL or the new event's start is after the last decision date, update the ceremony_decisions
                IF last_decision_date IS NULL OR NEW.start > last_decision_date THEN
                    UPDATE ceremony_decisions
                    SET ceremony = NEW.id
                    WHERE ceremony IS NULL;
                END IF;
            END IF;
        END;
    `);
}


export async function down(knex: Knex): Promise<void> {
    // Drop the triggers
    await knex.raw(`DROP TRIGGER IF EXISTS set_ceremony_decisions_ceremony_insert;`);
    await knex.raw(`DROP TRIGGER IF EXISTS set_ceremony_decisions_ceremony_update;`);

    // Drop the foreign key
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.dropForeign("ceremony", "FK_ceremony_decisions_ceremony");
    });

    // Set the column to be NOT nullable
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.integer("ceremony").unsigned().notNullable().alter();
    });

    // Recreate the foreign key
    await knex.schema.alterTable("ceremony_decisions", table => {
        table.foreign("ceremony", "FK_ceremony_decisions_ceremony")
            .references("id").inTable("events")
            .onDelete("cascade").onUpdate("cascade");
    });
}

