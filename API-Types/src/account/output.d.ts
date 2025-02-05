import {RequestSuccess} from "../index";

export interface ValidateTokenResponse extends RequestSuccess {
    data: number;
}

export interface AccountInfo {
    defaultPassword: boolean,
    suspended: boolean,
    lastUsed: Date | null,
    intents: {[key: string]: boolean}
}

export interface AccountInfoResponse extends RequestSuccess {
    data: Omit<AccountInfo, "lastUsed"> & {lastUsed: string | null}
}

export interface LoginResponse extends RequestSuccess {
    data: {
        token: string,
        forces: string[]
    }
}

interface UserForce {
    name: string,
    suspended: boolean
}

export interface UserForcesResponse extends RequestSuccess {
    data: {
        forces: UserForce[]
    }
}