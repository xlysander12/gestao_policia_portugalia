import {ValidateTokenResponse} from "@portalseguranca/api-types/account/output";
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