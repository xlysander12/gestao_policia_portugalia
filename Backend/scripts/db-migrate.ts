import knex, { Knex } from "knex";
import {getAllForces, getForceDatabase} from "../src/utils/config-handler";
import knexConfig from "../knexfile";
import {logToConsole} from "../src/utils/logger";

async function runMigrations() {
    // Get all the existing forces for the app
    const forces = getAllForces();

    // Loop through each force and run migrations in their database
    for (const force of forces) {
        logToConsole(`Running migrations for force: ${force}`, "info");

        // Creating a knex instance for the force's database
        const knexInstance = knex({
            ...knexConfig.main,
            connection: {
                ...knexConfig.main.connection as Knex.ConnectionConfig,
                database: getForceDatabase(force)
            }
        });

        try {
            await knexInstance.migrate.latest();
            logToConsole(`Migrations for force ${force} completed!`, "info");
        } catch (e) {
            logToConsole(`Error running migrations for force ${force}: ${e}`, "error");
            throw e;
        } finally {
            await knexInstance.destroy();
        }
    }
}

runMigrations()
    .then(() => process.exit(0))
    .catch((err: unknown) => {console.error(err); process.exit(1)});