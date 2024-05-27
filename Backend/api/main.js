const express = require('express');
const app = express.Router();

// Import util routes
app.use("/util", require("./util"));

// Import account routes
app.use("/account", require("./account"));

// Import Officer Info routes
app.use("/officerInfo", require("./officer-info"))

// Export everything
module.exports = app;

console.log("[Portal Segurança] API routes loaded successfully.")