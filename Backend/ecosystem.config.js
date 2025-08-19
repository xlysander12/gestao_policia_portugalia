const name = require("./pm2.appname").default;
module.exports = {
  apps : [{
    name   : name,
    script : "./dist/index.js"
  }]
}
