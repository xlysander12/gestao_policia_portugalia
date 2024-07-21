import express from 'express';
const app = express.Router();

// Import util routes
app.use("/util", require("./util/util"));

// Import metrics routes
app.use("/metrics", require("./metrics/metrics"));

// Import account routes
app.use("/account", require("./account/account"));

// Import Officer Info routes
app.use("/officerInfo", require("./officer-info/officer-info"))

// Export everything
module.exports = app;

console.log("[Portal Segurança] API routes loaded successfully.")