import {Request, NextFunction} from "express";
import {APIResponse} from "../types";
import routes, {methodType} from "../api/routes";
import { RequestError } from "@portalseguranca/api-types";
import {FORCE_HEADER} from "../utils/constants";

function getRouteDetailsMiddleware(req: Request, res: APIResponse, next: NextFunction) {
    // Check if the requested route is present in the routes object
    // The keys of this object, are RegEx that match the routes
    const routeIndex = Object.keys(routes).findIndex((route) => new RegExp(route).test(req.path));

    // If the route is not present, assume this route doesn't exist and return 404
    if (routeIndex === -1) {
        return res.status(404).json(<RequestError>{message: "Rota não encontrada"});
    }

    // Get the route object
    const route = routes[Object.keys(routes)[routeIndex]];

    // * Check if the used method is present in the route object
    // Cast the method to the required type
    const method = req.method as methodType;

    // If the method is not present, assume this method isn't valid for this route
    if (route.methods[method] === undefined) {
        return res.status(405).json(<RequestError>{message: "Método não permitido"});
    }

    // Since the method is present, store the values in locals
    res.locals.routeDetails = route.methods[method];

    // Check if there is a broadcast key in the route object
    if (res.locals.routeDetails.broadcast) {
        // If there is, create an event handler to broadcast the message to the clients when the response is sent
        res.on("finish", () => {
            if (res.locals.ws && req.header(FORCE_HEADER) && res.statusCode < 400) {
                res.locals.ws.to(req.header(FORCE_HEADER)!).emit(res.locals.routeDetails.broadcast!.event, res.locals.routeDetails.broadcast!.body(req, res));
            }
        });
    }


    next();
}

export default getRouteDetailsMiddleware;