"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const globals_1 = require("@jest/globals");
function runCommand(command) {
    return new Promise((resolve, reject) => {
        (0, node_child_process_1.exec)(command, (err, stdout, stderr) => {
            if (err) {
                reject(stderr || err.message);
            }
            else {
                resolve(stdout);
            }
        });
    });
}
describe('Backend properly builds with no errros', () => {
    (0, globals_1.it)("Build Backend", async () => {
        try {
            const output = await runCommand("npm run build");
            (0, globals_1.expect)(output).toBeDefined();
        }
        catch (error) {
            fail(error);
        }
    });
});
