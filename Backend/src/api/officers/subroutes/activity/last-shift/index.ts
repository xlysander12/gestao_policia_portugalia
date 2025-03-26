import express from "express";
import {getLastShiftController, updateLastShiftController} from "./controllers";

const app = express.Router();

app.get("/", getLastShiftController);

app.put("/", updateLastShiftController);

export default app;