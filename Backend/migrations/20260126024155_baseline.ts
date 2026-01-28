import type { Knex } from "knex";

export const config = {transaction: false};

export async function up(knex: Knex): Promise<void> {
    // Create "patent_categories" table
    await knex.schema.createTable("patent_categories", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
    });

    // Create table "patents"
    await knex.schema.createTable("patents", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.integer("category").notNullable();
        table.foreign("category", "FK_patents_category")
            .references("id").inTable("patent_categories")
            .onUpdate("cascade");
        table.integer("max_evaluation").defaultTo(-2).notNullable();
        table.string("leading_char", 25).nullable();
    });

    // Create table "status"
    await knex.schema.createTable("status", table => {
        table.integer("id", 11).primary().notNullable();
        table.string("name", 50).notNullable();
        table.string("color", 50).nullable();
        table.tinyint("can_patrol", 4).defaultTo(1).notNullable();
    });

    // Create table "officers"
    await knex.schema.createTable("officers", table => {
        table.string("name", 50).notNullable();
        table.integer("patent", 11).defaultTo(1).notNullable()
        table.foreign("patent", "FK_officers_patents")
            .references("id").inTable("patents")
            .onUpdate("cascade");

        table.string("callsign", 50).nullable();
        table.check("`callsign` regexp '^[A-Z]+(-([0-9]){2})?$'", undefined,"callsign_valida");

        table.integer("status", 11).defaultTo(1).notNullable();
        table.foreign("status", "FK_officers_status")
            .references("id").inTable("status")
            .onUpdate("cascade");

        table.date("entry_date").defaultTo(knex.fn.now()).notNullable();
        table.date("promotion_date").nullable();

        table.integer("phone", 9).notNullable().unique();
        table.check("`phone` regexp '^[0-9]{9}$'", undefined, "telemovel_valido");

        table.integer("nif", 9).primary().notNullable();
        table.check("`nif` regexp '^[0-9]{7,9}$'", undefined, "nif_valido");

        table.string("iban", 10).notNullable().unique();
        table.check("`iban` regexp '^(PT|OK)[0-9]{5,8}$'", undefined, "iban_valido");

        table.integer("kms", 11).defaultTo(0).notNullable();
        table.string("discord", 50).notNullable().unique();
        table.string("steam", 255).defaultTo("steam:0").notNullable();
        table.tinyint("visible", 3).unsigned().notNullable().defaultTo(1);
        table.check("`visible` = 0 or `visible` = 1", undefined, "visivel_valido");

        table.tinyint("fired", 3).unsigned().notNullable().defaultTo(0);
        table.check("`fired` = 0 or `fired` = 1", undefined, "fired_valido");

        table.text("fire_reason").nullable();
    });

    // Create triggers for table "officers"
    await knex.raw(`
        CREATE TRIGGER officers_force_callsign_uppercase_insert
        BEFORE INSERT ON officers
        FOR EACH ROW
        BEGIN
            SET NEW.callsign = UPPER(NEW.callsign);
        END
    `);
    await knex.raw(`
        CREATE TRIGGER officers_force_callsign_uppercase_update
        BEFORE UPDATE ON officers
        FOR EACH ROW
        BEGIN
            SET NEW.callsign = UPPER(NEW.callsign);
        END
    `);

    // Create view "officersV"
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

    // Create view "officersVPatrols"
    // await knex.raw(`
    //     CREATE VIEW officersVPatrols AS
    //     SELECT
    //         combined.name AS name,
    //         combined.patent AS patent,
    //         combined.patentCategory AS patentCategory,
    //         combined.callsign AS callsign,
    //         combined.status AS status,
    //         combined.entry_date AS entry_date,
    //         combined.promotion_date AS promotion_date,
    //         combined.phone AS phone,
    //         combined.nif AS nif,
    //         combined.iban AS iban,
    //         combined.kms AS kms,
    //         combined.discord AS discord,
    //         combined.steam AS steam,
    //         combined.officerForce as officerForce
    //     FROM (
    //         SELECT
    //             *,
    //             'psp' AS officerForce
    //         FROM portugalia_gestao_psp.officersV
    //         UNION ALL
    //         SELECT
    //             *,
    //             'gnr' AS officerForce
    //         FROM portugalia_gestao_gnr.officersV
    //     ) AS combined
    // `);

    // Create table "errors"
    await knex.schema.createTable("errors", table => {
        table.string("code", 50).primary().notNullable();
        table.string("route", 50).notNullable();
        table.enum("method", ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).notNullable();
        table.json("body");

        table.integer("nif", 11);
        table.foreign("nif", "FK_errors_officers")
            .references("nif").inTable("officers").onUpdate("cascade");

        table.text("stack", "longtext").notNullable();
        table.timestamp("timestamp").notNullable().defaultTo(knex.fn.now());
        table.tinyint("reported", 4).notNullable().defaultTo(0);
    });

    // Create table "announcements"
    await knex.schema.createTable("announcements", table => {
        table.increments("id").primary().notNullable();

        table.integer("author").notNullable();
        table.foreign("author", "FK_announcements_author")
            .references("nif").inTable("officers")
            .onUpdate("cascade");

        table.json("forces").notNullable().defaultTo("[]");
        table.json("tags").notNullable().defaultTo("[]");

        table.datetime("created").notNullable().defaultTo(knex.fn.now());
        table.datetime("expiration");
        table.check("`expiration` is null or `expiration` >= `created`", undefined, "CC_created_before_expiration");

        table.string("title", 255).notNullable();
        table.text("body", "longtext").notNullable();
    });

    // Create view "announcementsV"
    // await knex.raw(`
    //     CREATE VIEW announcementsV AS
    //     SELECT
    //         combined.id AS id,
    //         combined.author AS author,
    //         combined.forces AS forces,
    //         combined.tags AS tags,
    //         combined.created AS created,
    //         combined.expiration AS expiration,
    //         combined.title AS title,
    //         combined.body AS body
    //     FROM (
    //         SELECT
    //             CONCAT('psp', portugalia_gestao_psp.announcements.id) AS id,
    //             portugalia_gestao_psp.announcements.author AS author,
    //             portugalia_gestao_psp.announcements.forces AS forces,
    //             portugalia_gestao_psp.announcements.tags AS tags,
    //             portugalia_gestao_psp.announcements.created AS created,
    //             portugalia_gestao_psp.announcements.expiration AS expiration,
    //             portugalia_gestao_psp.announcements.title AS title,
    //             portugalia_gestao_psp.announcements.body AS body
    //         FROM portugalia_gestao_psp.announcements
    //         UNION ALL
    //         SELECT
    //             CONCAT('gnr', portugalia_gestao_gnr.announcements.id) AS id,
    //             portugalia_gestao_gnr.announcements.author AS author,
    //             portugalia_gestao_gnr.announcements.forces AS forces,
    //             portugalia_gestao_gnr.announcements.tags AS tags,
    //             portugalia_gestao_gnr.announcements.created AS created,
    //             portugalia_gestao_gnr.announcements.expiration AS expiration,
    //             portugalia_gestao_gnr.announcements.title AS title,
    //             portugalia_gestao_gnr.announcements.body AS body
    //         FROM portugalia_gestao_gnr.announcements
    //         WHERE portugalia_gestao_gnr.announcements.forces LIKE '%psp%'
    //     ) AS combined
    //     ORDER BY
    //         IF(combined.expiration IS NULL, 0, 1),
    //         combined.created DESC,
    //         combined.expiration DESC
    // `);

    // Create table "special_units"
    await knex.schema.createTable("special_units", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 100).notNullable();
        table.string("acronym", 50).notNullable();
        table.text("description");
    });

    // Create table "specialunits_roles"
    await knex.schema.createTable("specialunits_roles", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
    });

    // Create table "specialunits_officers"
    await knex.schema.createTable("specialunits_officers", table => {
        table.integer("officer").notNullable();
        table.foreign("officer", "FK_specialunits_officers_officer")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.integer("unit").notNullable();
        table.foreign("unit", "FK_specialunits_officers_unit")
            .references("id").inTable("special_units")
            .onUpdate("cascade");

        table.unique(["officer", "unit"], {indexName: "K_special_units_officers_unique_role_per_unit"});

        table.integer("role").notNullable();
        table.foreign("role", "FK_specialunits_officers_role")
            .references("id").inTable("specialunits_roles")
            .onUpdate("cascade");
    });

    // Create table "patrols_types"
    await knex.schema.createTable("patrols_types", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.tinyint("special").notNullable().defaultTo(0);
    });

    // Create table "patrols"
    await knex.schema.createTable("patrols", table => {
        table.increments("id").primary().notNullable();

        table.integer("type").notNullable();
        table.foreign("type", "FK_patrols_type")
            .references("id").inTable("patrols_types")
            .onUpdate("cascade");

        table.integer("special_unit").nullable();
        table.foreign("special_unit", "FK_patrols_special_unit")
            .references("id").inTable("special_units")
            .onUpdate("cascade");

        table.integer("registrar").notNullable();
        table.foreign("registrar", "FK_patrols_registrar")
            .references("nif").inTable("officers")
            .onUpdate("cascade");

        table.json("officers").notNullable();
        table.datetime("start").notNullable().defaultTo(knex.fn.now());
        table.datetime("end");

        table.check("start < end", undefined, "start_before_end");

        table.text("notes");
    });

    // * Add virtual columns to patrols table
    await knex.raw(`
        ALTER TABLE patrols
        ADD COLUMN canceled TINYINT(4)
            AS (IF(TIMESTAMPDIFF(MINUTE, start, end) < 5, 1, 0)) STORED 
    `);

    // * Create procedure to check if Patrol is Special
    await knex.raw(`
        CREATE PROCEDURE CheckPatrolSpecial (IN type_id INT, IN unit_value INT)
        LANGUAGE SQL
        DETERMINISTIC
        READS SQL DATA
        BEGIN
            DECLARE is_type_special TINYINT;
            SELECT special INTO is_type_special FROM patrols_types WHERE id = type_id;

            IF is_type_special = 1 AND unit_value IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Special unit is required for special patrols';
            END IF;
   
            IF is_type_special = 0 AND unit_value IS NOT NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Special unit is not required for regular patrols';
            END IF;
        END
    `);

    // * Create function to get patrol end time
    await knex.raw(`
        CREATE FUNCTION get_patrol_end(patrol_id INT) RETURNS DATETIME
        READS SQL DATA
        BEGIN
            DECLARE patrol_end DATETIME;
            
            SELECT end INTO patrol_end
            FROM patrols
            WHERE id = patrol_id
            LIMIT 1;
            
            RETURN patrol_end;
        END
    `);

    // * Create triggers to patrols table
    await knex.raw(`
        CREATE TRIGGER patrols_check_special_insert
        BEFORE INSERT ON patrols
        FOR EACH ROW
        BEGIN
            CALL CheckPatrolSpecial(NEW.type, NEW.special_unit);
        END
    `);
    await knex.raw(`
        CREATE TRIGGER patrols_check_special_update
        BEFORE UPDATE ON patrols
        FOR EACH ROW
        BEGIN
            CALL CheckPatrolSpecial(NEW.type, NEW.special_unit);
        END
    `);

    // Create view "patrolsV"
    // await knex.raw(`
    //     CREATE VIEW patrolsV AS
    //     SELECT
    //         CONCAT('psp', portugalia_gestao_psp.patrols.id) AS id,
    //         portugalia_gestao_psp.patrols.type AS type,
    //         portugalia_gestao_psp.patrols.special_unit AS special_unit,
    //         portugalia_gestao_psp.patrols.registrar AS registrar,
    //         portugalia_gestao_psp.patrols.officers AS officers,
    //         portugalia_gestao_psp.patrols.start AS start,
    //         portugalia_gestao_psp.patrols.end AS end,
    //         portugalia_gestao_psp.patrols.notes AS notes,
    //         portugalia_gestao_psp.patrols.canceled AS canceled
    //     FROM
    //         portugalia_gestao_psp.patrols
    //     UNION ALL
    //     SELECT
    //         CONCAT('gnr', portugalia_gestao_gnr.patrols.id) AS id,
    //         portugalia_gestao_gnr.patrols.type AS type,
    //         portugalia_gestao_gnr.patrols.special_unit AS special_unit,
    //         portugalia_gestao_gnr.patrols.registrar AS registrar,
    //         portugalia_gestao_gnr.patrols.officers AS officers,
    //         portugalia_gestao_gnr.patrols.start AS start,
    //         portugalia_gestao_gnr.patrols.end AS end,
    //         portugalia_gestao_gnr.patrols.notes AS notes,
    //         portugalia_gestao_gnr.patrols.canceled AS canceled
    //     FROM
    //         portugalia_gestao_gnr.patrols
    //     ORDER BY
    //         IF(end IS NULL, 0, 1),
    //         start DESC
    // `);

    // Create table "evaluation_decisions"
    await knex.schema.createTable("evaluation_decisions", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.string("color", 50).notNullable();
    });

    // Create table "evaluation_fields"
    await knex.schema.createTable("evaluation_fields", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();

        table.integer("starting_patent").notNullable();
        table.foreign("starting_patent", "FK_evaluation_fields_starting_patent")
            .references("id")
            .inTable("patents").onUpdate("cascade");
    });

    // Create table "evaluation_grades"
    await knex.schema.createTable("evaluation_grades", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.string("color", 50).notNullable();
    });

    // Create table "evaluations"
    await knex.schema.createTable("evaluations", table => {
        table.increments("id").primary().notNullable();

        table.integer("target").notNullable();
        table.foreign("target", "FK_evaluations_target")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.integer("author").notNullable();
        table.foreign("author", "FK_evaluations_author")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.integer("patrol").unsigned();
        table.foreign("patrol", "FK_evaluations_patrol")
            .references("id").inTable("patrols")
            .onUpdate("cascade").onDelete("set null");

        table.text("comments");

        table.integer("decision");
        table.foreign("decision", "FK_evaluations_decision")
            .references("id").inTable("evaluation_decisions")
            .onUpdate("cascade");

        table.datetime("timestamp");
    });

    // Create triggers for table "evaluations"
    await knex.raw(`
        CREATE TRIGGER evaluations_ensure_timestamp_insert
        BEFORE INSERT ON evaluations
        FOR EACH ROW
        BEGIN
            IF NEW.patrol IS NULL AND NEW.timestamp IS NULL THEN
                SET NEW.timestamp = CURRENT_TIMESTAMP();
            END IF;
        END
    `);
    await knex.raw(`
        CREATE TRIGGER evaluations_ensure_timestamp_update
        BEFORE UPDATE ON evaluations
        FOR EACH ROW
        BEGIN
            IF NEW.patrol IS NULL AND NEW.timestamp IS NULL THEN
                SET NEW.timestamp = CURRENT_TIMESTAMP();
            END IF;
        END
    `);

    // Create view "evaluationsV"
    await knex.raw(`
        CREATE VIEW evaluationsV AS
        SELECT
            evaluations.id AS id,
            evaluations.target AS target,
            evaluations.author AS author,
            evaluations.patrol AS patrol,
            evaluations.comments AS comments,
            evaluations.decision AS decision,
            IF(
                evaluations.patrol IS NOT NULL,
                IFNULL(
                    get_patrol_end(evaluations.patrol),
                    CURRENT_TIMESTAMP()
                ),
                evaluations.timestamp
            ) AS timestamp
        FROM evaluations
        ORDER BY 
            IF(
                evaluations.patrol IS NOT NULL,
                IFNULL(
                    get_patrol_end(evaluations.patrol),
                    CURRENT_TIMESTAMP()
                ),
                evaluations.timestamp
            ) DESC,
            evaluations.id DESC
    `);

    // Create table "evaluations_data"
    await knex.schema.createTable("evaluations_data", table => {
        table.integer("evaluation").unsigned().notNullable();
        table.foreign("evaluation", "FK_evaluations_data_evaluation")
            .references("id").inTable("evaluations")
            .onUpdate("cascade").onDelete("cascade");

        table.integer("field").notNullable();
        table.foreign("field", "FK_evaluations_data_field")
            .references("id").inTable("evaluation_fields")
            .onUpdate("cascade");

        table.unique(["evaluation", "field"], {indexName: "K_evaluations_data_unique_field_per_evaluation"});

        table.integer("grade").notNullable();
        table.foreign("grade", "FK_evaluations_data_grade")
            .references("id").inTable("evaluation_grades")
            .onUpdate("cascade");

        table.text("comments");
    });

    // Create table intents
    await knex.schema.createTable("intents", table => {
        table.string("name", 50).primary().notNullable();
        table.text("description").notNullable();
    });

    // Create table "event_types"
    await knex.schema.createTable("event_types", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.enum("variant", ["custom", "ceremony", "special_unit"]).notNullable().defaultTo("custom");

        table.string("intent", 50);
        table.foreign("intent", "FK_event_types_intent")
            .references("name")
            .inTable("intents")
            .onUpdate("cascade").onDelete("set null");
    });

    // Create table "events"
    await knex.schema.createTable("events", table => {
        table.increments("id").primary().notNullable();

        table.integer("type").notNullable();
        table.foreign("type", "FK_events_type")
            .references("id")
            .inTable("event_types").onUpdate("cascade");

        table.integer("special_unit");
        table.foreign("special_unit", "FK_events_special_unit")
            .references("id")
            .inTable("special_units").onUpdate("cascade");

        table.integer("author").notNullable();
        table.foreign("author", "FK_events_author")
            .references("nif")
            .inTable("officers").onUpdate("cascade");

        table.string("title", 255);
        table.text("description");

        table.json("assignees").notNullable().defaultTo("[]");

        table.datetime("start").notNullable().defaultTo(knex.fn.now());
        table.datetime("end").notNullable().defaultTo(knex.fn.now());
        table.check("`start` <= `end`", undefined, "CC_start_before_end");
    });

    // Create triggers to events table
    await knex.raw(`
        CREATE TRIGGER events_ensure_fields_insert
        BEFORE INSERT ON events
        FOR EACH ROW
        BEGIN
            # Get the type variant of the Event
            DECLARE variant VARCHAR(20);
            
            SELECT event_types.variant INTO variant FROM event_types WHERE event_types.id = NEW.\`type\`;

            # If the event type has the "custom" variant, title must not be NULL
            IF variant = 'custom' AND NEW.title IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A title must be given in Custom Events';
            END IF;
            
            # If the event type has the "special_unit" variant, a special unit must be given
            IF variant = 'special_unit' AND NEW.special_unit IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A Special Unit must be given in Special Unit Events';
            END IF;
        END
    `);
    await knex.raw(`
        CREATE TRIGGER events_ensure_fields_update
        BEFORE UPDATE ON events
        FOR EACH ROW
        BEGIN
            # Get the type variant of the Event
            DECLARE variant VARCHAR(20);
            
            SELECT event_types.variant INTO variant FROM event_types WHERE event_types.id = NEW.\`type\`;

            # If the event type has the "custom" variant, title must not be NULL
            IF variant = 'custom' AND NEW.title IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A title must be given in Custom Events';
            END IF;
            
            # If the event type has the "special_unit" variant, a special unit must be given
            IF variant = 'special_unit' AND NEW.special_unit IS NULL THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A Special Unit must be given in Special Unit Events';
            END IF;
        END
    `);

    // Create view "eventsV"
    // await knex.raw(`
    //     CREATE VIEW eventsV AS
    //     SELECT
    //         combined.id AS id,
    //         combined.force AS \`force\`,
    //         combined.type AS type,
    //         combined.special_unit AS special_unit,
    //         combined.author AS author,
    //         combined.title AS title,
    //         combined.description AS description,
    //         combined.assignees AS assignees,
    //         combined.start AS start,
    //         combined.end AS end
    //     FROM (
    //         SELECT
    //             portugalia_gestao_psp.events.id AS id,
    //             'psp' AS \`force\`,
    //             portugalia_gestao_psp.events.type AS type,
    //             portugalia_gestao_psp.events.special_unit AS special_unit,
    //             portugalia_gestao_psp.events.author AS author,
    //             CASE
    //                 WHEN portugalia_gestao_psp.event_types.variant = 'ceremony' THEN portugalia_gestao_psp.event_types.name
    //                 WHEN portugalia_gestao_psp.event_types.variant = 'special_unit' THEN
    //                     CONCAT(portugalia_gestao_psp.event_types.name, ' - ', portugalia_gestao_psp.special_units.name)
    //                 ELSE portugalia_gestao_psp.events.title
    //             END AS title,
    //             portugalia_gestao_psp.events.description AS description,
    //             portugalia_gestao_psp.events.assignees AS assignees,
    //             portugalia_gestao_psp.events.start AS start,
    //             portugalia_gestao_psp.events.end AS end
    //         FROM (
    //             (
    //                 portugalia_gestao_psp.events
    //                 JOIN portugalia_gestao_psp.event_types ON portugalia_gestao_psp.events.type = portugalia_gestao_psp.event_types.id
    //             )
    //             LEFT JOIN portugalia_gestao_psp.special_units ON portugalia_gestao_psp.events.special_unit = portugalia_gestao_psp.special_units.id
    //         )
    //         UNION ALL
    //         SELECT
    //             portugalia_gestao_gnr.events.id AS id,
    //             'psp' AS \`force\`,
    //             portugalia_gestao_gnr.events.type AS type,
    //             portugalia_gestao_gnr.events.special_unit AS special_unit,
    //             portugalia_gestao_gnr.events.author AS author,
    //             CASE
    //                 WHEN portugalia_gestao_gnr.event_types.variant = 'ceremony' THEN portugalia_gestao_gnr.event_types.name
    //                 WHEN portugalia_gestao_gnr.event_types.variant = 'special_unit' THEN
    //                     CONCAT(portugalia_gestao_gnr.event_types.name, ' - ', portugalia_gestao_gnr.special_units.name)
    //                 ELSE portugalia_gestao_gnr.events.title
    //             END AS title,
    //             portugalia_gestao_gnr.events.description AS description,
    //             portugalia_gestao_gnr.events.assignees AS assignees,
    //             portugalia_gestao_gnr.events.start AS start,
    //             portugalia_gestao_gnr.events.end AS end
    //         FROM (
    //             (
    //                 portugalia_gestao_gnr.events
    //                 JOIN portugalia_gestao_gnr.event_types ON portugalia_gestao_gnr.events.type = portugalia_gestao_gnr.event_types.id
    //             )
    //             LEFT JOIN portugalia_gestao_gnr.special_units ON portugalia_gestao_gnr.events.special_unit = portugalia_gestao_gnr.special_units.id
    //         )
    //     ) AS combined
    // `);

    // Create table "ceremony_decisions"
    await knex.schema.createTable("ceremony_decisions", table => {
        table.increments("id").primary().notNullable();

        table.integer("target").notNullable();
        table.foreign("target", "FK_ceremony_decisions_target")
            .references("nif").inTable("officers")
            .onUpdate("cascade");

        table.integer("category").notNullable();
        table.foreign("category", "FK_ceremony_decisions_category")
            .references("id").inTable("patent_categories")
            .onUpdate("cascade");

        table.integer("ceremony").unsigned().notNullable();
        table.foreign("ceremony", "FK_ceremony_decisions_ceremony")
            .references("id").inTable("events")
            .onUpdate("cascade");

        table.integer("decision");
        table.foreign("decision", "FK_ceremony_decisions_decision")
            .references("id").inTable("evaluation_decisions")
            .onUpdate("cascade");

        table.text("details");

        table.unique(["category", "target", "ceremony"], {indexName: "1_per_target_per_ceremony"});
    });

    // Create triggers for table "ceremony_decisions"
    await knex.raw(`
        CREATE TRIGGER ceremony_decisions_ensure_event_type
        BEFORE INSERT ON ceremony_decisions
        FOR EACH ROW
        BEGIN
            # Create variable to hold event variant
            DECLARE variant VARCHAR(20);
                  
            SELECT 
                event_types.variant INTO variant
            FROM events
            JOIN event_types ON events.type = event_types.id
            WHERE events.id = NEW.ceremony;
            
            # If the chosen event is not of variant "ceremony", don't accept it
            IF variant <> 'ceremony' THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'ceremony field must be an event of variant "ceremony"';
            END IF;
        END
    `);

    // Create view "ceremony_decisionsV"
    await knex.raw(`
        CREATE VIEW ceremony_decisionsV AS
        SELECT
            ceremony_decisions.id AS id,
            ceremony_decisions.target AS target,
            ceremony_decisions.category AS category,
            ceremony_decisions.ceremony AS ceremony,
            ceremony_decisions.decision AS decision,
            ceremony_decisions.details AS details
        FROM (
            ceremony_decisions
            JOIN events ON ceremony_decisions.ceremony = events.id
        )
        ORDER BY
                events.start DESC,
                ceremony_decisions.category DESC
    `);

    // Create table "last_ceremony"
    await knex.schema.createTable("last_ceremony", table => {
        table.date("date").notNullable();
    });

    // Create table "inactivity_types"
    await knex.schema.createTable("inactivity_types", table => {
        table.integer("id").primary().notNullable();
        table.string("name", 50).notNullable();
        table.text("description").notNullable();
        table.string("color", 50).notNullable();

        table.integer("status");
        table.foreign("status", "FK_inactivity_types_status")
            .references("id").inTable("status")
            .onUpdate("cascade").onDelete("set null");
    });

    // Create table "officer_hours"
    await knex.schema.createTable("officer_hours", table => {
        table.increments("id").primary().notNullable();

        table.integer("officer").notNullable();
        table.foreign("officer", "FK_officer_hours_officer")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.date("week_start").notNullable();
        table.date("week_end").notNullable();
        table.integer("minutes").notNullable();

        table.integer("submitted_by").notNullable();
        table.foreign("submitted_by", "FK_officer_hours_submitted_by")
            .references("nif").inTable("officers")
            .onUpdate("cascade");

        table.check("`week_end` > `week_start`", undefined, "CC_officer_hours_start_greater_end");
    });

    // Create table "officer_justifications"
    await knex.schema.createTable("officer_justifications", table => {
        table.increments("id").primary().notNullable();

        table.integer("officer").notNullable();
        table.foreign("officer", "FK_officer_justifications_officer")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.integer("type").notNullable();
        table.foreign("type", "FK_officer_justifications_type")
            .references("id").inTable("inactivity_types")
            .onUpdate("cascade");

        table.date("start_date").notNullable().defaultTo(knex.fn.now());
        table.date("end_date");
        table.text("description").notNullable();
        table.enum("status", ["pending", "denied", "approved"]).notNullable().defaultTo("pending");
        table.text("comment");

        table.integer("managed_by");
        table.foreign("managed_by", "FK_officer_justifications_managed_by")
            .references("nif").inTable("officers")
            .onUpdate("cascade");

        table.datetime("timestamp").notNullable().defaultTo(knex.fn.now());
    });

    // Create table "officer_last_dates_fields"
    await knex.schema.createTable("officer_last_dates_fields", table => {
        table.string("id").primary().notNullable();
        table.text("display").notNullable();
        table.integer("max_days");
        table.integer("position").notNullable().defaultTo(1);
    });

    // Create table "officer_last_dates_values"
    await knex.schema.createTable("officer_last_dates_values", table => {
        table.integer("officer").notNullable();
        table.foreign("officer", "FK_last_dates_officer")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.string("field").notNullable();
        table.foreign("field", "FK_last_dates_field")
            .references("id").inTable("officer_last_dates_fields")
            .onUpdate("cascade");

        table.unique(["officer", "field"], {indexName: "unique_date_per_field_per_office"});

        table.date("last_date");
    });

    // Create table "users"
    await knex.schema.createTable("users", table => {
        table.integer("nif").primary().notNullable();
        table.foreign("nif", "FK_users_officers")
            .references("nif").inTable("officers")
            .onUpdate("cascade").onDelete("cascade");

        table.string("password", 255);
        table.tinyint("password_login").notNullable().defaultTo(1);
        table.tinyint("discord_login").notNullable().defaultTo(1);
        table.tinyint("suspended").notNullable().defaultTo(0);
        table.datetime("last_interaction");
    });

    // Create table "user_intents"
    await knex.schema.createTable("user_intents", table => {
        table.integer("user").notNullable();
        table.foreign("user", "FK_user_intents_user")
            .references("nif").inTable("users")
            .onUpdate("cascade").onDelete("cascade");

        table.string("intent", 50).notNullable();
        table.foreign("intent", "FK_user_intents_intent")
            .references("name").inTable("intents")
            .onUpdate("cascade").onDelete("cascade");

        table.tinyint("enabled").notNullable().defaultTo(0);

        table.unique(["user", "intent"], {indexName: "UNIQUE_intent_per_user"});
    });

    // Create table "sessions"
    await knex.schema.createTable("sessions", table => {
        table.string("session", 64).primary().notNullable();

        table.integer("nif").notNullable();
        table.foreign("nif", "FK_tokens_nif")
            .references("nif").inTable("users")
            .onUpdate("cascade").onDelete("cascade");

        table.tinyint("persistent").notNullable().defaultTo(0);
        table.datetime("last_used").notNullable().defaultTo(knex.fn.now());
    });

    // Create event "CheckTokens"
    await knex.raw(`
        CREATE EVENT CheckTokens
        ON SCHEDULE EVERY 1 MINUTE STARTS '2000-01-01 00:00:00'
        ON COMPLETION PRESERVE
        ENABLE
        DO
        BEGIN
            -- If the token is not persistent and has not been used in the last 2 hours, delete it
            DELETE FROM sessions WHERE persistent = 0 AND TIMESTAMPDIFF(HOUR, last_used, NOW()) > 2;
    
            -- If the token is persistent, instead of 2 hours, check if it has not been used in the last 7 days
            DELETE FROM sessions WHERE persistent = 1 AND TIMESTAMPDIFF(DAY, last_used, NOW()) > 7;
        END;
    `);

    // Create event "EndPatrolsMorning"
    await knex.raw(`
        CREATE EVENT EndPatrolsMorning
        ON SCHEDULE EVERY 1 DAY STARTS '2000-01-01 08:00:00'
        ON COMPLETION PRESERVE
        ENABLE
        DO
            UPDATE patrols SET end = CURRENT_TIMESTAMP() WHERE end IS NULL;
    `);

    // Create event "EndPatrolsNight"
    await knex.raw(`
        CREATE EVENT EndPatrolsNight
        ON SCHEDULE EVERY 1 DAY STARTS '2000-01-01 19:00:00'
        ON COMPLETION PRESERVE
        ENABLE
        DO
            UPDATE patrols SET end = CURRENT_TIMESTAMP() WHERE end IS NULL;
    `);

    // Create event "UpdateLastCeremonyFromEvents"
    await knex.raw(`
        CREATE EVENT UpdateLastCeremonyFromEvents
        ON SCHEDULE EVERY 1 MINUTE STARTS '2000-01-01 00:00:00'
        ON COMPLETION PRESERVE
        ENABLE
        DO
        BEGIN
            DECLARE ceremony DATE;
            
            SELECT
                end
            INTO
                ceremony
            FROM
                events
            JOIN
                event_types ON events.type = event_types.id
            WHERE
                event_types.variant = 'ceremony' AND
                CAST(events.end AS DATE) > (SELECT COALESCE(MAX(date), '1000-01-01') FROM last_ceremony) AND
                events.end <= CURRENT_TIMESTAMP()
            ORDER BY
                events.end DESC
            LIMIT 1;
            
            IF ceremony IS NOT NULL THEN
                IF EXISTS (SELECT 1 FROM last_ceremony) THEN
                    UPDATE last_ceremony SET date = ceremony;
                ELSE
                    INSERT INTO last_ceremony (date) VALUES (ceremony);
                END IF;
            END IF;
        END;
    `);
}


export function down(knex: Knex): Promise<void> {
    throw new Error("Baseline migration cannot be rolled back");
}

