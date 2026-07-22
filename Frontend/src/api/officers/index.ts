import {QueryBundle} from "@api/types.ts";
import {OfficerInfoGetResponse, OfficerListResponse} from "@portalseguranca/api-types/officers/output";
import {make_request, RequestMethod} from "../../utils/requests.ts";

export function getOfficersList(): QueryBundle<OfficerListResponse> {
    return {
        queryKeys: ["officersList"],
        queryfn: async() => {
            const response = await make_request(`/officers`, RequestMethod.GET);
            const responseJson = await response.json() as OfficerListResponse;

            if (!response.ok) {
                throw new Error(responseJson.message);
            }

            return responseJson;
        }
    }
}

export function getOfficerData(nif: number): QueryBundle<OfficerInfoGetResponse> {
    return {
        queryKeys: ["officerData", nif],
        queryfn: async() => {
            const response = await make_request(`/officers/${nif}`, RequestMethod.GET);
            const responseJson = await response.json() as OfficerInfoGetResponse;

            if (!response.ok) {
                throw new Error(responseJson.message);
            }

            return responseJson;
        }
    }
}