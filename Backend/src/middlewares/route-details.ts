import {Request, NextFunction} from "express";
import {APIResponse} from "../types";
import routes, {methodType} from "../api/routes";
import { RequestError } from "@portalseguranca/api-types";

function getRouteDetailsMiddleware(req: Request, res: APIResponse<RequestError>, next: NextFunction) {
    // Check if the requested route is present in the routes object
    // The keys of this object, are RegEx that match the routes
    const routeIndex = Object.keys(routes).findIndex((route) => new RegExp(route).test(req.path));

    // If the route is not present, assume this route doesn't exist and return 404
    if (routeIndex === -1) {
        res.status(404).json(({message: "Rota não encontrada"}));
        return;
    }

    // Get the route object
    const route = routes[Object.keys(routes)[routeIndex]];

    // * Check if the used method is present in the route object
    // Cast the method to the required type
    const method = req.method as methodType;

    // If the method is not present, assume this method isn't valid for this route
    if (route.methods[method] === undefined) {
        res.status(405).json({message: "Método não permitido"});
        return;
    }

    // Since the method is present, store the values in locals
    res.locals.routeDetails = route.methods[method];


    next();
}

export default getRouteDetailsMiddleware;