import {RequestSuccess} from "../schema";

export interface ValidateTokenPostResponse extends RequestSuccess {
    data: number;
}

export interface AccountInfoResponse extends RequestSuccess {
    data: {
        defaultPassword: boolean,
        lastUsed: Date,
        intents: {[key: string]: boolean}
    }
}