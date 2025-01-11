import pc from "picocolors";

export function colorFromMethod(method: string) {
    switch (method) {
        case "GET":
            return pc.green;
        case "POST":
            return pc.yellow;
        case "PUT":
            return pc.blue;
        case "PATCH":
                return pc.magenta;
        case "DELETE":
            return pc.red;
        default:
            return pc.white;
    }
}

export function colorFromCode(code: number) {
    if (code >= 500) { // Server error
        return pc.red;
    } else if (code >= 400) { // Client error
        return pc.yellow;
    } else if (code >= 300) { // Redirect
        return pc.cyan;
    } else if (code >= 200) { // Success
        return pc.green;
    } else { // Informational
        return pc.blue;
    }
}

export function logToConsole(message: string) {
    console.log(`${pc.blue("[Portal Segurança]")} [${new Date().toISOString()}] ${message}`);
}