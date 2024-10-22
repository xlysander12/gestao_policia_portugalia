import {RequestSuccess} from "../index";

export interface ValidateTokenResponse extends RequestSuccess {
    data: number;
}

export interface AccountInfoResponse extends RequestSuccess {
    data: {
        passwordChanged: boolean,
        suspended: boolean,
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

interface UserForce {
    name: string,
    suspended: boolean
}

export interface UserForcesResponse extends RequestSuccess {
    data: {
        forces: UserForce[]
    }
}