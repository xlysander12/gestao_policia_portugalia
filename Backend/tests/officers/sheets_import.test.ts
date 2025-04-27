import {isHubRowReadable} from "../../src/utils/config-handler";

it("Knows row is readable", () => {
    const readable = isHubRowReadable("psp", 94);

    expect(readable).toBe(true);
});