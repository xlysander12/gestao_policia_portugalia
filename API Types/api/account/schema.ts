import {RequestSuccess} from "../schema";

export interface ValidateTokenResponse extends RequestSuccess {
    data: number;
}

export interface AccountInfoResponse extends RequestSuccess {
    data: {
        defaultPassword: boolean,
        lastUsed: Date,
        intents: {[key: string]: boolean}
    }
}

export interface LoginResponse extends RequestSuccess {
    data: {
        token: string
    }
}