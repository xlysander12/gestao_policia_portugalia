"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const node_test_1 = require("node:test");
(0, node_test_1.test)("Build Backend", () => {
    const output = (0, child_process_1.execSync)("");
});
