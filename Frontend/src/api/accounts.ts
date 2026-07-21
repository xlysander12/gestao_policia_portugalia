import {ValidateTokenResponse} from "@portalseguranca/api-types/account/output";
import {QueryBundle} from "./types.ts";
import {ValidateTokenRequestBodyType} from "@portalseguranca/api-types/account/input.ts";
import {make_request, RequestMethod} from "../utils/requests.ts";

function validateSession(data?: ValidateTokenRequestBodyType): QueryBundle {
    return {
        queryKeys: ["validateSession"],
        queryfn: async (): Promise<ValidateTokenResponse> => {
            const response = await make_request<ValidateTokenRequestBodyType>(`/api/accounts/validate-session`, RequestMethod.POST, {
                body: data
            });

            if (!response.ok) {
                throw new Error(`Error validating session: ${response.statusText}`);
            }

            return await response.json() as ValidateTokenResponse;
        }
    }
}