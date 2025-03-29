import {BaseResponse} from "../index";

export interface ValidateTokenResponse extends BaseResponse {
    data: number;
}

export interface AccountInfo {
    defaultPassword: boolean,
    suspended: boolean,
    lastUsed: number | null,
    intents: {[key: string]: boolean}
}

export interface AccountInfoResponse extends BaseResponse {
    data: AccountInfo
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