import {exec} from "node:child_process";
import {expect, it} from "@jest/globals";

function runCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err) {
                reject(stderr || err.message);
            } else {
                resolve(stdout);
            }
        })
    });
}


describe('Backend properly builds with no errros', () => {
    it("Build Backend", async () => {
        try {
            const output = await runCommand("npm run build");
            expect(output).toBeDefined();
        } catch (error) {
            fail(error);
        }
    });
});