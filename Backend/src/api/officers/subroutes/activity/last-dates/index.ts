import express from "express";
import {getLastDateController, updateLastShiftController} from "./controllers";
import lastDateFieldExists from "../../../../../middlewares/activity-last-dates";

const app = express.Router();

app.use("/:field", lastDateFieldExists);

app.get("/:field", getLastDateController);

app.patch("/:field", updateLastShiftController);

export default app;