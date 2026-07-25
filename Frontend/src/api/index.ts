import { BaseResponse } from "@portalseguranca/api-types";
import {make_request, RequestMethod} from "../utils/requests.ts";

export async function defaultRequest<ReturnType extends BaseResponse = BaseResponse, BodyType = never>(url: string, method: RequestMethod, body?: BodyType): Promise<ReturnType> {
    const response = await make_request(url, method, {
        body
    });
    const responseJson = await response.json() as ReturnType;

    if (!response.ok) {
        throw new Error(responseJson.message);
    }

    return responseJson;
}