import express from "express";
import {getOfficerJustificationsHistoryController} from "./controllers";

const app = express.Router();

app.get("/", getOfficerJustificationsHistoryController);

export default app;