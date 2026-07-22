import {
    AccountInfoResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/account/output";
import {QueryBundle} from "./types.ts";
import {ValidateTokenRequestBodyType} from "@portalseguranca/api-types/account/input.ts";
import {make_request, RequestMethod} from "../utils/requests.ts";

export function validateSession(data?: ValidateTokenRequestBodyType): QueryBundle<ValidateTokenResponse> {
    return {
        queryKeys: ["validateSession"],
        queryfn: async () => {
            const response = await make_request<ValidateTokenRequestBodyType>(`/accounts/validate-session`, RequestMethod.POST, {
                body: data,
                redirectToLoginOn401: false
            });

            if (!response.ok) {
                throw new Error(`Error validating session: ${response.statusText}`);
            }

            return await response.json() as ValidateTokenResponse;
        }
    }
}

export function getAccountData(nif: number): QueryBundle<AccountInfoResponse> {
    return {
        queryKeys: ["accountData", nif],
        queryfn: async () => {
            const response = await make_request(`/accounts/${nif}`, RequestMethod.GET);
            const responseJson = await response.json() as AccountInfoResponse;

            if (!response.ok) {
                throw new Error(responseJson.message);
            }

            return responseJson;
        }
    }
}

export function getAccountForces(nif: number): QueryBundle<UserForcesResponse> {
    return {
        queryKeys: ["accountForces", nif],
        queryfn: async () => {
            const response = await make_request(`/accounts/${nif}/forces`, RequestMethod.GET);
            const responseJson = await response.json() as UserForcesResponse;

            if (!response.ok) {
                throw new Error(responseJson.message);
            }

            return responseJson;
        }
    }
}