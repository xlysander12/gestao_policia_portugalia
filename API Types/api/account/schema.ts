import {RequestSuccess} from "../schema";

export interface ValidateTokenResponse extends RequestSuccess {
    data: number;
}

export interface AccountInfoResponse extends RequestSuccess {
    data: {
        passwordChanged: boolean,
        lastUsed: string,
        intents: {[key: string]: boolean}
    }
}

export interface LoginResponse extends RequestSuccess {
    data: {
        token: string,
        forces: string[]
    }
}

export interface UserForcesResponse extends RequestSuccess {
    data: {
        forces: string[]
    }
}