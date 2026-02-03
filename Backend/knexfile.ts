import type { Knex } from "knex";
import {getDatabaseDetails, loadConfig} from "./src/utils/config-handler";
import path from "node:path";

// On importing, load the config from the JSON file
loadConfig();

const BASE_CONFIG: Knex.Config = {
    client: "mysql2",
    connection: {
        ...getDatabaseDetails(),
        timezone: "Z",
        multipleStatements: true
    },
    pool: {
        min: 2,
        max: 10
    },
    migrations: {
        directory: path.resolve(__dirname, "migrations"),
        extension: "ts",
        tableName: "knex_migrations"
    }
};

const config: Record<string, Knex.Config> = {
    test: {
        ...BASE_CONFIG,
        connection: {
            host: "localhost",
            port: 3306,
            user: "portalseguranca_local",
            password: "super-secret",
            database: "migrationtest"
        }
    },
    main: BASE_CONFIG,
};

export default config;