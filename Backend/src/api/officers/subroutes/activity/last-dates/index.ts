import express from "express";
import {getLastDateController, updateLastDateController} from "./controllers";
import lastDateFieldExists from "../../../../../middlewares/activity-last-dates";

const app = express.Router();

app.use("/:field", lastDateFieldExists);

app.get("/:field", getLastDateController);

app.patch("/:field", updateLastDateController);

export default app;