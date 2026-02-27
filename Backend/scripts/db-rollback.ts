import knex, { Knex } from "knex";
import {getAllForces, getForceDatabase} from "../src/utils/config-handler";
import knexConfig from "../knexfile";
import {logToConsole} from "../src/utils/logger";

async function runRollback() {
    // Get all the existing forces for the app
    const forces = getAllForces();

    // Loop through each force and run migrations in their database
    for (const force of forces) {
        logToConsole(`Rolling back last batch for force: ${force}`, "info");

        // Creating a knex instance for the force's database
        const knexInstance = knex({
            ...knexConfig.main,
            connection: {
                ...knexConfig.main.connection as Knex.ConnectionConfig,
                database: getForceDatabase(force)
            }
        });

        try {
            await knexInstance.migrate.rollback();
            logToConsole(`Rollback for force ${force} completed!`, "info");
        } catch (e) {
            logToConsole(`Error running rollback for force ${force}: ${e}`, "error");
            throw e;
        } finally {
            await knexInstance.destroy();
        }
    }
}

runRollback()
    .then(() => process.exit(0))
    .catch((err: unknown) => {console.error(err); process.exit(1)});