import express from 'express';
import infoRoutes from './info';
import manageRoutes from './manage';

const app = express.Router();


// Load the info routes
app.use(infoRoutes);

// Load the management routes
app.use(manageRoutes);


console.log("[Portal Segurança] Officers routes loaded successfully.")

export default app;