import express from 'express';
import utilRoutes from "./util";
import metricsRoutes from "./metrics";
import accountRoutes from "./accounts";
import officerInfoRoutes from "./officers";
import patrolsRoutes from "./patrols";
import {
    assureBodyFields,
    assureRouteBasicInfo,
    errorHandlerMiddleware,
    getRouteDetailsMiddleware
} from "../middlewares";
import {loggerMiddleware} from "../middlewares";
import {logToConsole} from "../utils/logger";

const apiRoutes = express.Router();

// * Import Middlewares
// Middleware to log all requests
apiRoutes.use(loggerMiddleware);

// Middleware to gather the route's information from the routes object
apiRoutes.use(getRouteDetailsMiddleware);

// Middleware to check if the request has basic necessary information
apiRoutes.use(assureRouteBasicInfo);

// Middleware to check if the request has all the fields valid
apiRoutes.use(assureBodyFields);

// * Import Routes
// Import util routes
apiRoutes.use("/util", utilRoutes);

// Import metrics routes
apiRoutes.use("/metrics", metricsRoutes);

// Import accounts routes
apiRoutes.use("/accounts", accountRoutes);

// Import Officer Info routes
apiRoutes.use("/officers", officerInfoRoutes);

// Import all Patrols routes
apiRoutes.use("/patrols", patrolsRoutes);

// * Middleware to handle errors
apiRoutes.use(errorHandlerMiddleware);


logToConsole("API routes loaded successfully", "info");

export default apiRoutes;