const fs = require("fs");

function getAppName() {
    try {
        return fs.readFileSync("pm2.appname.txt", "utf8");
    } catch (err) {
        return "Portal-Seguranca";
    }
}

module.exports = {
  apps : [{
    name   : getAppName(),
    script : "./dist/index.js"
  }]
}
