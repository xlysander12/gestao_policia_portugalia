import {APIResponse} from "../../../types";
import express from "express";

export async function getAnnouncementsController(req: express.Request, res: APIResponse) {
    res.status(200).json({message: "Works"});
}