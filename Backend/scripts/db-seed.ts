import knex, { Knex } from "knex";
import { getAllForces, getForceDatabase } from "../src/utils/config-handler";
import knexConfig from "../knexfile";
import { logToConsole } from "../src/utils/logger";

async function seedForce(force: string) {
    logToConsole(`Seeding force [${force}] with initial data`);

    const knexInstance = knex({
        ...knexConfig.main,
        connection: {
            ...knexConfig.main.connection as Knex.ConnectionConfig,
            database: getForceDatabase(force)
        }
    });

    try {
        await knexInstance.seed.run();
        logToConsole(`Seeding for force ${force} completed!`, "info");
    } catch (e) {
        logToConsole(`Error seeding force ${force}: ${e}`, "error");
        throw e;
    } finally {
        await knexInstance.destroy();
    }
}

async function runSeeds() {

    const forces = getAllForces();

    await Promise.all(forces.map((force) => seedForce(force)));
}

runSeeds()
    .then(() => process.exit(0))
    .catch((err: unknown) => { console.error(err); process.exit(1) });