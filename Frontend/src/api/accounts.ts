import {
    AccountInfoResponse,
    LoginResponse,
    UserForcesResponse,
    ValidateTokenResponse
} from "@portalseguranca/api-types/account/output";
import {QueryBundle} from "./types.ts";
import {
    ChangeAccountInfoRequestBodyType,
    ChangePasswordRequestBodyType,
    LoginRequestBodyType,
    ValidateTokenRequestBodyType
} from "@portalseguranca/api-types/account/input.ts";
import {make_request, RequestMethod} from "../utils/requests.ts";
import {BaseResponse} from "@portalseguranca/api-types";
import {defaultRequest} from "@api/index.ts";

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
        queryfn: async () => await defaultRequest(`/accounts/${nif}`, RequestMethod.GET)
    }
}

export function getAccountForces(nif: number): QueryBundle<UserForcesResponse> {
    return {
        queryKeys: ["accountForces", nif],
        queryfn: async () => await defaultRequest(`/accounts/${nif}/forces`, RequestMethod.GET)
    }
}

export function login(body: LoginRequestBodyType): QueryBundle<LoginResponse> {
    return {
        queryKeys: ["login"],
        queryfn: async () => {
            const response = await make_request(`/accounts/login`, RequestMethod.POST, {
                body,
                redirectToLoginOn401: false
            });
            const responseJson = await response.json() as LoginResponse;

            if (!response.ok) {
                throw new Error(responseJson.message);
            }

            return responseJson;
        }
    }
}

// TODO: Discord login


export function logout(): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["logout"],
        queryfn: async () => await defaultRequest("/accounts/logout", RequestMethod.POST)
    }
}

export function changePassword(body: ChangePasswordRequestBodyType): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["changePassword"],
        queryfn: async () => await defaultRequest("/accounts/change-password", RequestMethod.POST, body)
    }
}

export function resetPassword(nif: number): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["resetPassword"],
        queryfn: async () => await defaultRequest(`/accounts/${nif}/reset-password`, RequestMethod.POST)
    }
}

export function createAccount(nif: number): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["createAccount"],
        queryfn: async () => await defaultRequest(`/accounts/${nif}`, RequestMethod.POST)
    }
}

export function editAccount(nif: number, body: ChangeAccountInfoRequestBodyType): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["editAccount"],
        queryfn: async () => await defaultRequest(`/accounts/${nif}`, RequestMethod.PATCH, body)
    }
}

export function deleteAccount(nif: number): QueryBundle<BaseResponse> {
    return {
        queryKeys: ["deleteAccount"],
        queryfn: async () => await defaultRequest(`/accounts/${nif}`, RequestMethod.DELETE)
    }
}