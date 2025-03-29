import {BaseResponse} from "../index";

export interface ValidateTokenResponse extends BaseResponse {
    data: number;
}

export interface AccountInfo {
    defaultPassword: boolean,
    suspended: boolean,
    lastUsed: Date | null,
    intents: {[key: string]: boolean}
}

export interface AccountInfoResponse extends BaseResponse {
    data: Omit<AccountInfo, "lastUsed"> & {lastUsed: number | null}
}

export interface LoginResponse extends BaseResponse {
    data: {
        token: string,
        forces: string[]
    }
}

interface UserForce {
    name: string,
    suspended: boolean
}

export interface UserForcesResponse extends BaseResponse {
    data: {
        forces: UserForce[]
    }
}