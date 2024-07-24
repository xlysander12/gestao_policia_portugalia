import express from 'express';
import {utilRoutes} from "./util/util";
import {metricsRoutes} from "./metrics/metrics";
import {accountRoutes} from "./account/account";
import {officerInfoRoutes} from "./officer-info/officer-info";
export const apiRoutes = express.Router();

// Import util routes
apiRoutes.use("/util", utilRoutes);

// Import metrics routes
apiRoutes.use("/metrics", metricsRoutes);

// Import account routes
apiRoutes.use("/account", accountRoutes);

// Import Officer Info routes
apiRoutes.use("/officerInfo", officerInfoRoutes)

console.log("[Portal Segurança] API routes loaded successfully.")